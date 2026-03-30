import { EventEmitter } from 'events';
import type { AgentState, AgentStatus, AgentEvent, Seat } from '../shared/types.js';
import { SessionDiscovery, type DiscoveredSession } from './session-discovery.js';

// Timeout thresholds (ms)
const WAITING_TIMEOUT = 30_000;  // 30s after last assistant message -> waiting
const IDLE_TIMEOUT = 60_000;     // 60s -> idle
const DONE_TIMEOUT = 5 * 60_000; // 5m file unchanged -> done

// New detection timers (ms)
const PERMISSION_TIMER_DELAY_MS = 7_000;   // 7s after non-exempt tool_use -> permission
const TEXT_IDLE_DELAY_MS = 5_000;           // 5s text-only idle -> waiting

// Tools exempt from permission timer
const PERMISSION_EXEMPT_TOOLS = new Set(['Task', 'Agent', 'AskUserQuestion']);

interface AgentTimers {
  permissionTimer: ReturnType<typeof setTimeout> | null;
  textIdleTimer: ReturnType<typeof setTimeout> | null;
  hadToolsInTurn: boolean;
  backgroundAgentIds: Set<string>;    // tool IDs of active background agents
  activeSubAgents: Map<string, string>; // toolCallId -> subAgentId
}

// Default fallback seats when office-layout is not available
const DEFAULT_SEATS: Seat[] = Array.from({ length: 12 }, (_, i) => ({
  id: `seat-${i}`,
  tileX: 2 + (i % 4) * 3,
  tileY: 2 + Math.floor(i / 4) * 3,
  deskTileX: 2 + (i % 4) * 3,
  deskTileY: 1 + Math.floor(i / 4) * 3,
  facing: 'down' as const,
}));

/**
 * Manages agent states based on incoming AgentEvents.
 * Emits 'agent-update', 'agent-added', 'agent-removed' events.
 */
export class AgentStateMachine extends EventEmitter {
  private agents: Map<string, AgentState> = new Map();
  private seats: Seat[] = [...DEFAULT_SEATS];
  private seatAssignments: Map<string, string> = new Map(); // agentId -> seatId
  private agentCounter = 0;
  private subAgentCounter = 0;  // counts down for negative sub-agent IDs
  private timeoutCheckInterval: ReturnType<typeof setInterval> | null = null;
  private layoutReady: Promise<void>;
  private agentTimers: Map<string, AgentTimers> = new Map();

  constructor() {
    super();
    this.layoutReady = this.loadOfficeLayout();
  }

  /**
   * Resolves when the office layout has been loaded (or failed to load).
   * Await this before starting session discovery to ensure real seats are used.
   */
  async waitForLayout(): Promise<void> {
    await this.layoutReady;
  }

  /**
   * Try to load seats from the shared office-layout module.
   * Falls back to DEFAULT_SEATS if not available.
   */
  private async loadOfficeLayout(): Promise<void> {
    try {
      // Dynamic import -- the module may not exist yet
      const layout = await import('../shared/office-layout.js') as Record<string, unknown>;
      const officeLayout = (layout as { officeLayout?: { seats?: Seat[] } }).officeLayout;
      const defaultExport = (layout as { default?: { seats?: Seat[] } }).default;

      if (officeLayout?.seats && officeLayout.seats.length > 0) {
        this.seats = officeLayout.seats;
        console.log(`[StateMachine] Loaded ${this.seats.length} seats from office-layout`);
      } else if (defaultExport?.seats && defaultExport.seats.length > 0) {
        this.seats = defaultExport.seats;
        console.log(`[StateMachine] Loaded ${this.seats.length} seats from office-layout (default export)`);
      }
    } catch {
      console.log('[StateMachine] office-layout not available, using default seats');
    }
  }

  start(): void {
    // Check for timed-out agents every 5 seconds
    this.timeoutCheckInterval = setInterval(() => this.checkTimeouts(), 5000);
  }

  stop(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
    // Clear all per-agent timers
    for (const agentId of this.agentTimers.keys()) {
      this.cancelAllTimers(agentId);
    }
    this.agentTimers.clear();
  }

  /**
   * Process an incoming agent event and update state accordingly.
   */
  processEvent(event: AgentEvent): void {
    let agent = this.getAgentBySessionId(event.sessionId);

    if (!agent) {
      // Create new agent for this session
      agent = this.createAgent(event.sessionId);
    }

    const timers = this.getTimers(agent.id);

    // Any new data cancels active timers
    this.cancelAllTimers(agent.id);
    if (agent.permissionPending) {
      agent.permissionPending = false;
      // Will emit update below
    }

    // SUB-05: Check for sub-agent completion via tool_result with a matching tool_use_id
    if (event.type === 'tool_result') {
      const rawEntry = event.raw as Record<string, unknown>;
      const toolUseId = rawEntry?.tool_use_id as string | undefined;
      if (toolUseId) {
        // Search all parent agents for a sub-agent tracked by this toolCallId
        for (const [, parentTimers] of this.agentTimers) {
          const subAgentId = parentTimers.activeSubAgents.get(toolUseId);
          if (subAgentId) {
            this.removeSubAgent(subAgentId);
            break;
          }
        }
      }
    }

    // DETECT-01: turn_end (definitive turn end)
    if (event.type === 'turn_end') {
      agent.status = 'waiting';
      agent.lastAction = event.content;
      agent.lastUpdated = event.timestamp;
      timers.hadToolsInTurn = false;
      this.emit('agent-update', { ...agent });
      return;
    }

    // DETECT-04: queue-operation (background agent completion)
    if (event.type === 'queue-operation') {
      // A queue-operation event typically signals background agent activity.
      // Check if this is a completion signal and remove from tracking.
      const rawEntry = event.raw as Record<string, unknown>;
      const toolId = rawEntry?.tool_use_id as string | undefined;
      if (toolId && timers.backgroundAgentIds.has(toolId)) {
        timers.backgroundAgentIds.delete(toolId);
        console.log(`[StateMachine] Background agent completed: ${toolId} for ${agent.id}`);
      }
      agent.lastUpdated = event.timestamp;
      this.emit('agent-update', { ...agent });
      return;
    }

    // DETECT-04: background-tool (run_in_background)
    if (event.type === 'background-tool') {
      // Extract tool call ID from raw for tracking
      const rawEntry = event.raw as Record<string, unknown>;
      const message = rawEntry?.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          const b = block as Record<string, unknown>;
          if (b?.type === 'tool_use' && b?.id) {
            timers.backgroundAgentIds.add(b.id as string);
            console.log(`[StateMachine] Background agent tracked: ${b.id} for ${agent.id}`);
          }
        }
      }
      agent.lastUpdated = event.timestamp;
      agent.lastAction = event.content;
      this.emit('agent-update', { ...agent });
      return;
    }

    // Standard event processing
    const previousStatus = agent.status;
    const newStatus = this.deriveStatus(event);

    agent.status = newStatus;
    agent.lastAction = event.content;
    agent.lastUpdated = event.timestamp;

    // DETECT-02 setup: Start permission timer for non-exempt tool_use
    if (event.type.startsWith('tool_use:') && event.toolName) {
      timers.hadToolsInTurn = true;
      if (!PERMISSION_EXEMPT_TOOLS.has(event.toolName)) {
        timers.permissionTimer = setTimeout(() => {
          timers.permissionTimer = null;
          const currentAgent = this.agents.get(agent!.id);
          if (currentAgent && !currentAgent.permissionPending) {
            currentAgent.permissionPending = true;
            this.emit('agent-update', { ...currentAgent });
          }
        }, PERMISSION_TIMER_DELAY_MS);
      }
    }

    // SUB-01: Spawn sub-agent for Task/Agent tool invocations
    // Uses tool_use blocks (not progress records) as spawn trigger — more reliable,
    // provides toolCallId for lifecycle tracking (tool_result matching).
    if ((event.toolName === 'Task' || event.toolName === 'Agent') && event.toolCallId) {
      this.createSubAgent(agent, event.toolCallId, event.toolName);
    }

    // DETECT-05: Start text-idle timer for text-only response
    if (event.type === 'assistant_text') {
      timers.textIdleTimer = setTimeout(() => {
        timers.textIdleTimer = null;
        const currentAgent = this.agents.get(agent!.id);
        if (currentAgent && currentAgent.status !== 'waiting' && currentAgent.status !== 'done') {
          currentAgent.status = 'waiting';
          this.emit('agent-update', { ...currentAgent });
        }
      }, TEXT_IDLE_DELAY_MS);
    }

    if (previousStatus !== newStatus || agent.permissionPending === false) {
      this.emit('agent-update', { ...agent });
    }
  }

  /**
   * Called by session-discovery when a new session appears.
   * Creates the agent proactively.
   */
  onSessionAdded(session: DiscoveredSession): void {
    let agent = this.getAgentBySessionId(session.sessionId);
    if (!agent) {
      agent = this.createAgent(session.sessionId, session.projectHash);
      // New agents start in idle until we see activity
    }
  }

  /**
   * Called by session-discovery when a session is removed.
   */
  onSessionRemoved(session: DiscoveredSession): void {
    const agent = this.getAgentBySessionId(session.sessionId);
    if (agent) {
      agent.status = 'done';
      this.emit('agent-update', { ...agent });

      // Remove after emitting the done status
      setTimeout(() => {
        this.removeAgent(agent.id);
      }, 2000);
    }
  }

  getAgents(): AgentState[] {
    return Array.from(this.agents.values()).map(a => ({ ...a }));
  }

  getAgentBySessionId(sessionId: string): AgentState | undefined {
    for (const agent of this.agents.values()) {
      if (agent.sessionId === sessionId) return agent;
    }
    return undefined;
  }

  /**
   * Derive the appropriate AgentStatus from an event.
   */
  private deriveStatus(event: AgentEvent): AgentStatus {
    const { type } = event;

    // tool_use events
    if (type.startsWith('tool_use:')) {
      const toolName = type.replace('tool_use:', '');

      switch (toolName) {
        case 'Write':
        case 'Edit':
          return 'typing';

        case 'Read':
        case 'Glob':
        case 'Grep':
          return 'reading';

        case 'Bash':
        case 'Agent':
          return 'executing';

        default:
          // Unknown tools default to executing
          return 'executing';
      }
    }

    // Assistant text output
    if (type === 'assistant_text') {
      return 'typing';
    }

    // User message means assistant is now waiting for user
    if (type === 'user') {
      return 'waiting';
    }

    // Tool results mean we're still working
    if (type === 'tool_result') {
      return 'executing';
    }

    return 'idle';
  }

  /** Get or create timers for an agent */
  private getTimers(agentId: string): AgentTimers {
    let timers = this.agentTimers.get(agentId);
    if (!timers) {
      timers = {
        permissionTimer: null,
        textIdleTimer: null,
        hadToolsInTurn: false,
        backgroundAgentIds: new Set(),
        activeSubAgents: new Map(),
      };
      this.agentTimers.set(agentId, timers);
    }
    return timers;
  }

  /** Cancel all active timers for an agent */
  private cancelAllTimers(agentId: string): void {
    const timers = this.agentTimers.get(agentId);
    if (!timers) return;
    if (timers.permissionTimer) { clearTimeout(timers.permissionTimer); timers.permissionTimer = null; }
    if (timers.textIdleTimer) { clearTimeout(timers.textIdleTimer); timers.textIdleTimer = null; }
  }

  /** Cancel permission timer only */
  private cancelPermissionTimer(agentId: string): void {
    const timers = this.agentTimers.get(agentId);
    if (!timers?.permissionTimer) return;
    clearTimeout(timers.permissionTimer);
    timers.permissionTimer = null;
  }

  /** Cancel text-idle timer only */
  private cancelTextIdleTimer(agentId: string): void {
    const timers = this.agentTimers.get(agentId);
    if (!timers?.textIdleTimer) return;
    clearTimeout(timers.textIdleTimer);
    timers.textIdleTimer = null;
  }

  /**
   * Create a new agent for the given session.
   */
  private createAgent(sessionId: string, projectPath?: string): AgentState {
    this.agentCounter++;
    const projectName = projectPath
      ? SessionDiscovery.projectNameFromPath(projectPath)
      : this.extractProjectNameFromSessionId(sessionId);

    const agentId = `agent-${this.agentCounter}`;
    const seat = this.assignSeat(agentId);

    const agent: AgentState = {
      id: agentId,
      name: `Claude-${abbreviate(projectName)}-${this.agentCounter}`,
      sessionId,
      status: 'idle',
      lastAction: '',
      lastUpdated: Date.now(),
      permissionPending: false,
      position: seat
        ? { x: seat.tileX, y: seat.tileY }
        : { x: 2 + (this.agentCounter % 6) * 2, y: 2 + Math.floor(this.agentCounter / 6) * 2 },
    };

    this.agents.set(agentId, agent);
    this.emit('agent-added', { ...agent });
    console.log(`[StateMachine] Agent created: ${agent.name} (${sessionId})`);

    return agent;
  }

  private removeAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Cascade: clean up any active sub-agents before removing the parent
    const timers = this.agentTimers.get(agentId);
    if (timers) {
      for (const subAgentId of timers.activeSubAgents.values()) {
        this.removeSubAgent(subAgentId);
      }
    }

    this.cancelAllTimers(agentId);
    this.agentTimers.delete(agentId);
    this.releaseSeat(agentId);
    this.agents.delete(agentId);
    this.emit('agent-removed', { ...agent });
    console.log(`[StateMachine] Agent removed: ${agent.name}`);
  }

  /**
   * SUB-01: Spawn a sub-agent when a Task or Agent tool is invoked.
   * Sub-agents use negative IDs (sub--1, sub--2, ...) and reference the parent via parentId.
   */
  private createSubAgent(parentAgent: AgentState, toolCallId: string, toolName: string): AgentState {
    this.subAgentCounter--;
    const subAgentId = `sub-${this.subAgentCounter}`;  // e.g. "sub--1", "sub--2"

    const subAgent: AgentState = {
      id: subAgentId,
      name: `${parentAgent.name}/${toolName}`,
      sessionId: parentAgent.sessionId,
      status: 'executing',
      lastAction: `Sub-agent: ${toolName}`,
      lastUpdated: Date.now(),
      position: { ...parentAgent.position },  // Engine will reposition to nearest walkable
      permissionPending: false,
      parentId: parentAgent.id,
    };

    this.agents.set(subAgentId, subAgent);

    // Track in parent's timers for lifecycle matching
    const timers = this.getTimers(parentAgent.id);
    timers.activeSubAgents.set(toolCallId, subAgentId);

    this.emit('agent-added', { ...subAgent });
    console.log(`[StateMachine] Sub-agent spawned: ${subAgentId} (parent: ${parentAgent.id}, tool: ${toolCallId})`);

    return subAgent;
  }

  /**
   * SUB-05: Remove a sub-agent and clean up its parent's tracking map.
   */
  private removeSubAgent(subAgentId: string): void {
    const subAgent = this.agents.get(subAgentId);
    if (!subAgent) return;

    // Remove from parent's activeSubAgents tracking
    if (subAgent.parentId) {
      const parentTimers = this.agentTimers.get(subAgent.parentId);
      if (parentTimers) {
        for (const [toolId, sId] of parentTimers.activeSubAgents) {
          if (sId === subAgentId) {
            parentTimers.activeSubAgents.delete(toolId);
            break;
          }
        }
      }
    }

    this.agents.delete(subAgentId);
    this.emit('agent-removed', { ...subAgent });
    console.log(`[StateMachine] Sub-agent removed: ${subAgentId}`);
  }

  /**
   * Assign the first available seat to an agent.
   */
  private assignSeat(agentId: string): Seat | null {
    const assignedSeatIds = new Set(this.seatAssignments.values());

    for (const seat of this.seats) {
      if (!assignedSeatIds.has(seat.id)) {
        this.seatAssignments.set(agentId, seat.id);
        seat.assignedAgentId = agentId;
        return seat;
      }
    }

    return null; // No seats available
  }

  private releaseSeat(agentId: string): void {
    const seatId = this.seatAssignments.get(agentId);
    if (!seatId) return;

    this.seatAssignments.delete(agentId);
    const seat = this.seats.find(s => s.id === seatId);
    if (seat) {
      seat.assignedAgentId = undefined;
    }
  }

  /**
   * Check all agents for timeout-based state transitions.
   */
  private checkTimeouts(): void {
    const now = Date.now();

    for (const agent of this.agents.values()) {
      if (agent.status === 'done') continue;

      const elapsed = now - agent.lastUpdated;
      let newStatus: AgentStatus | null = null;

      if (elapsed >= DONE_TIMEOUT) {
        newStatus = 'done';
      } else if (elapsed >= IDLE_TIMEOUT && agent.status !== 'idle' && agent.status !== 'waiting') {
        newStatus = 'idle';
      } else if (elapsed >= WAITING_TIMEOUT && (agent.status === 'typing' || agent.status === 'reading' || agent.status === 'executing')) {
        newStatus = 'waiting';
      }

      if (newStatus && newStatus !== agent.status) {
        agent.status = newStatus;
        this.emit('agent-update', { ...agent });
      }
    }
  }

  /**
   * Try to guess project name from context when no project path is available.
   */
  private extractProjectNameFromSessionId(_sessionId: string): string {
    return 'unknown';
  }
}

/**
 * Create a short abbreviation from a project name.
 * e.g. "iosys-pixel-lab" -> "PxLab", "my-cool-project" -> "MyCool"
 */
function abbreviate(name: string): string {
  const parts = name.split(/[-_]/);
  if (parts.length === 1) {
    // Single word: capitalize and take first 6 chars
    return capitalize(name).slice(0, 6);
  }
  // Multi-word: take first letter of each, capitalize, max 8 chars
  const abbr = parts
    .map(p => capitalize(p))
    .join('')
    .slice(0, 8);
  return abbr;
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
