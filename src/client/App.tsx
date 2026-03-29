import { useCallback, useRef, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAgentState } from './hooks/useAgentState';
import OfficeCanvas from './components/OfficeCanvas';
import AgentPanel from './components/AgentPanel';
import StatusBar from './components/StatusBar';
import Tooltip from './components/Tooltip';
import type { AgentState } from '@shared/types';

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
        </div>
        <AgentPanel agents={agentList} onAgentClick={handlePanelAgentClick} />
      </main>
      <StatusBar
        connectionState={connectionState}
        agentCount={agentList.length}
      />
    </div>
  );
}
