import { useRef } from 'react';
import type { AgentState } from '@shared/types';
import { useGameEngine } from '../hooks/useGameEngine';

interface OfficeCanvasProps {
  agents: Map<string, AgentState>;
  onAgentClick: (agentId: string) => void;
  focusOnAgentRef: React.MutableRefObject<((id: string) => void) | null>;
}

export default function OfficeCanvas({
  agents,
  onAgentClick,
  focusOnAgentRef,
}: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { focusOnAgent } = useGameEngine({
    canvasRef,
    agents,
    onAgentClick,
  });

  // Expose focusOnAgent to parent
  focusOnAgentRef.current = focusOnAgent;

  return (
    <div className="office-canvas-container">
      <canvas ref={canvasRef} className="office-canvas" />
    </div>
  );
}
