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

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diff < 60) {
    return `${diff}s ago`;
  }
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function shouldBlink(status: AgentStatus): boolean {
  return status === 'waiting' || status === 'error';
}

export default function AgentPanel({ agents, onAgentClick, collapsed }: AgentPanelProps) {
  return (
    <aside className={`agent-panel${collapsed ? ' agent-panel-collapsed' : ''}`}>
      <div className="agent-panel-header">
        <h2 className="agent-panel-title">Agents</h2>
        <span className="agent-panel-count">{agents.length}</span>
      </div>
      <div className="agent-panel-list">
        {agents.length === 0 && (
          <div className="agent-panel-empty">No agents connected</div>
        )}
        {agents.map((agent) => (
          <button
            key={agent.id}
            className="agent-card"
            onClick={() => onAgentClick(agent.id)}
            type="button"
          >
            <div className="agent-card-header">
              <span
                className={`agent-status-dot${shouldBlink(agent.status) ? ' blink' : ''}`}
                style={{ backgroundColor: getStatusColor(agent.status) }}
              />
              <span className="agent-card-name">{agent.name}</span>
            </div>
            <div
              className="agent-card-status"
              style={{ color: getStatusColor(agent.status) }}
            >
              {getStatusLabel(agent.status)}
            </div>
            <div className="agent-card-action" title={agent.lastAction}>
              {agent.lastAction || 'No recent activity'}
            </div>
            <div className="agent-card-footer">
              <span className="agent-card-session" title={agent.sessionId}>
                {agent.sessionId.slice(0, 8)}
              </span>
              <span className="agent-card-time">
                {formatTimeAgo(agent.lastUpdated)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
