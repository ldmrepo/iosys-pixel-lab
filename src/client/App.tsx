import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgentState } from './hooks/useAgentState';
import OfficeCanvas from './components/OfficeCanvas';
import AgentPanel from './components/AgentPanel';
import StatusBar from './components/StatusBar';
import Tooltip from './components/Tooltip';
import SoundToggle from './components/SoundToggle';
import { ChimeSound } from '@engine/ChimeSound';
import type { AgentState, AgentStatus } from '@shared/types';

interface TooltipData {
  agent: AgentState;
  x: number;
  y: number;
}

export default function App() {
  const { connectionState, lastMessage } = useWebSocket();
  const { agents, agentList } = useAgentState(lastMessage);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const focusOnAgentRef = useRef<((id: string) => void) | null>(null);
  const chimeRef = useRef<ChimeSound | null>(null);
  const [soundMuted, setSoundMuted] = useState(() => {
    const stored = localStorage.getItem('pixel-office-sound-enabled');
    return stored === 'false';
  });
  const [panelCollapsed, setPanelCollapsed] = useState(() => {
    return localStorage.getItem('pixel-office-panel-collapsed') === 'true';
  });
  const prevAgentStatusRef = useRef<Map<string, AgentStatus>>(new Map());

  // Lazy-init chime on first render
  if (!chimeRef.current) {
    chimeRef.current = new ChimeSound();
  }

  useEffect(() => {
    const chime = chimeRef.current;
    if (!chime) return;

    const prevStatuses = prevAgentStatusRef.current;

    for (const [id, agent] of agents) {
      const prevStatus = prevStatuses.get(id);
      // Play chime when any agent transitions TO 'waiting' from a non-waiting state
      if (agent.status === 'waiting' && prevStatus !== undefined && prevStatus !== 'waiting') {
        chime.play();
        break; // One chime per update cycle is enough
      }
    }

    // Update previous status map
    const newMap = new Map<string, AgentStatus>();
    for (const [id, agent] of agents) {
      newMap.set(id, agent.status);
    }
    prevAgentStatusRef.current = newMap;
  }, [agents]);

  const handleSoundToggle = useCallback(() => {
    const chime = chimeRef.current;
    if (chime) {
      const newMuted = chime.toggle();
      setSoundMuted(newMuted);
    }
  }, []);

  const handlePanelToggle = useCallback(() => {
    setPanelCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pixel-office-panel-collapsed', String(next));
      return next;
    });
  }, []);

  const handleCanvasAgentClick = useCallback(
    (agentId: string) => {
      const agent = agents.get(agentId);
      if (!agent) return;

      // Position tooltip near center of canvas area
      // The engine handles hit detection; we show the tooltip at a reasonable spot
      const canvasContainer = document.querySelector('.office-canvas-container');
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        setTooltip({
          agent,
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    },
    [agents]
  );

  const handlePanelAgentClick = useCallback((agentId: string) => {
    focusOnAgentRef.current?.(agentId);
    setTooltip(null);
  }, []);

  const handleTooltipClose = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Pixel Office</h1>
        <SoundToggle muted={soundMuted} onToggle={handleSoundToggle} />
      </header>
      <main className="app-main">
        <div className="canvas-wrapper">
          <OfficeCanvas
            agents={agents}
            onAgentClick={handleCanvasAgentClick}
            focusOnAgentRef={focusOnAgentRef}
          />
          {tooltip && (
            <Tooltip
              agent={tooltip.agent}
              x={tooltip.x}
              y={tooltip.y}
              onClose={handleTooltipClose}
            />
          )}
          <button
            className="panel-toggle"
            onClick={handlePanelToggle}
            type="button"
            title={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {panelCollapsed ? '\u25C0' : '\u25B6'}
          </button>
        </div>
        <AgentPanel
          agents={agentList}
          onAgentClick={handlePanelAgentClick}
          collapsed={panelCollapsed}
        />
      </main>
      <StatusBar
        connectionState={connectionState}
        agentCount={agentList.length}
      />
    </div>
  );
}
