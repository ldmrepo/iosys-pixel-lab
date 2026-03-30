import { useEffect, useRef } from 'react';
import type { AgentState, AgentStatus } from '@shared/types';

interface TooltipProps {
  agent: AgentState;
  x: number;
  y: number;
  onClose: () => void;
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

export default function Tooltip({ agent, x, y, onClose }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    // Delay to avoid catching the same click that opened the tooltip
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust position to keep tooltip on screen
  const style: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    transform: 'translate(-50%, -100%) translateY(-12px)',
    zIndex: 100,
  };

  return (
    <div ref={tooltipRef} className="tooltip" style={style}>
      <div className="tooltip-header">
        <span
          className="tooltip-status-dot"
          style={{ backgroundColor: getStatusColor(agent.status) }}
        />
        <span className="tooltip-name">{agent.name}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Status:</span>
        <span className="tooltip-value" style={{ color: getStatusColor(agent.status) }}>
          {agent.status}
        </span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Action:</span>
        <span className="tooltip-value">{agent.lastAction || 'None'}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Session:</span>
        <span className="tooltip-value tooltip-session">{agent.sessionId}</span>
      </div>
    </div>
  );
}
