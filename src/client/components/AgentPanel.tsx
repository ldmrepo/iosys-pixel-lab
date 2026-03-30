import { useState, useEffect, useMemo } from 'react';
import type { AgentState, AgentStatus } from '@shared/types';

interface AgentPanelProps {
  agents: AgentState[];
  onAgentClick: (id: string) => void;
  collapsed: boolean;
}

function getStatusColor(status: AgentStatus): string {
  const colors: Record<AgentStatus, string> = {
    typing:     'var(--status-typing)',
    reading:    'var(--status-reading)',
    executing:  'var(--status-executing)',
    waiting:    'var(--status-waiting)',
    idle:       'var(--status-idle)',
    done:       'var(--status-done)',
    error:      'var(--status-error)',
    walk_down:  'var(--status-idle)',
    walk_up:    'var(--status-idle)',
    walk_right: 'var(--status-idle)',
    walk_left:  'var(--status-idle)',
  };
  return colors[status];
}

function getStatusLabel(status: AgentStatus): string {
  const labels: Record<AgentStatus, string> = {
    typing:     'Typing',
    reading:    'Reading',
    executing:  'Executing',
    waiting:    'Waiting',
    idle:       'Idle',
    done:       'Done',
    error:      'Error',
    walk_down:  'Walking',
    walk_up:    'Walking',
    walk_right: 'Walking',
    walk_left:  'Walking',
  };
  return labels[status];
}

function formatElapsed(createdAt: number): string {
  const elapsed = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function shouldBlink(status: AgentStatus): boolean {
  return status === 'waiting' || status === 'error';
}

export default function AgentPanel({ agents, onAgentClick, collapsed }: AgentPanelProps) {
  // Tick every second to keep elapsed times updated
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Group agents into root + sub-agent hierarchy
  const groupedAgents = useMemo(() => {
    const roots: AgentState[] = [];
    const childrenMap = new Map<string, AgentState[]>();

    for (const agent of agents) {
      if (agent.parentId) {
        const children = childrenMap.get(agent.parentId) || [];
        children.push(agent);
        childrenMap.set(agent.parentId, children);
      } else {
        roots.push(agent);
      }
    }

    // Build flat ordered list: root, then its children, then next root...
    const result: { agent: AgentState; isSubAgent: boolean }[] = [];
    for (const root of roots) {
      result.push({ agent: root, isSubAgent: false });
      const children = childrenMap.get(root.id) || [];
      for (const child of children) {
        result.push({ agent: child, isSubAgent: true });
      }
    }
    return result;
  }, [agents]);

  // Count only root agents for the badge
  const rootAgentCount = agents.filter(a => !a.parentId).length;

  return (
    <aside className={`agent-panel${collapsed ? ' agent-panel-collapsed' : ''}`}>
      <div className="agent-panel-header">
        <h2 className="agent-panel-title">Agents</h2>
        <span className="agent-panel-count">{rootAgentCount}</span>
      </div>
      <div className="agent-panel-list">
        {agents.length === 0 && (
          <div className="agent-panel-empty">No agents connected</div>
        )}
        {groupedAgents.map(({ agent, isSubAgent }) => (
          <button
            key={agent.id}
            className={`agent-card${isSubAgent ? ' agent-card-sub' : ''}`}
            onClick={() => onAgentClick(agent.id)}
            type="button"
          >
            <div className="agent-card-header">
              <span
                className={`agent-status-dot${shouldBlink(agent.status) ? ' blink' : ''}`}
                style={{ backgroundColor: getStatusColor(agent.status) }}
              />
              <span className="agent-card-name">
                {isSubAgent ? agent.name.split('/').pop() : agent.name}
              </span>
              <span className="agent-card-elapsed">
                {formatElapsed(agent.createdAt)}
              </span>
            </div>
            <div className="agent-card-info">
              <span
                className="agent-card-status"
                style={{ color: getStatusColor(agent.status) }}
              >
                {getStatusLabel(agent.status)}
              </span>
              {agent.lastAction && (
                <span className="agent-card-tool" title={agent.lastAction}>
                  {agent.lastAction}
                </span>
              )}
            </div>
            {/* Phase 12 placeholder: token/cost will go here */}
            <div className="agent-card-token-placeholder" />
          </button>
        ))}
      </div>
    </aside>
  );
}
