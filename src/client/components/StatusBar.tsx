import { useEffect, useState } from 'react';
import type { ConnectionState } from '../hooks/useWebSocket';

interface StatusBarProps {
  connectionState: ConnectionState;
  agentCount: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false });
}

function getConnectionLabel(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'reconnecting':
      return 'Reconnecting...';
    case 'disconnected':
      return 'Disconnected';
  }
}

function getConnectionColor(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return 'var(--status-typing)';
    case 'reconnecting':
      return 'var(--status-waiting)';
    case 'disconnected':
      return 'var(--status-error)';
  }
}

export default function StatusBar({ connectionState, agentCount }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isReconnecting = connectionState === 'reconnecting';

  return (
    <footer className="status-bar">
      <div className="status-bar-section">
        <span
          className={`status-bar-dot${isReconnecting ? ' blink' : ''}`}
          style={{ backgroundColor: getConnectionColor(connectionState) }}
        />
        <span className="status-bar-label">
          {getConnectionLabel(connectionState)}
        </span>
      </div>
      <div className="status-bar-divider" />
      <div className="status-bar-section">
        <span className="status-bar-label">
          Agents: {agentCount}
        </span>
      </div>
      <div className="status-bar-divider" />
      <div className="status-bar-section">
        <span className="status-bar-label">
          {formatTime(currentTime)}
        </span>
      </div>
    </footer>
  );
}
