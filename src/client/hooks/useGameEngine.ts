import { useEffect, useRef, useCallback, type RefObject } from 'react';
import { PixelOfficeEngine } from '@engine/index';
import type { AgentState } from '@shared/types';

interface UseGameEngineOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  agents: Map<string, AgentState>;
  onAgentClick?: (agentId: string) => void;
}

interface UseGameEngineReturn {
  focusOnAgent: (id: string) => void;
}

export function useGameEngine({
  canvasRef,
  agents,
  onAgentClick,
}: UseGameEngineOptions): UseGameEngineReturn {
  const engineRef = useRef<PixelOfficeEngine | null>(null);
  const prevAgentIdsRef = useRef<Set<string>>(new Set());
  const onAgentClickRef = useRef(onAgentClick);

  // Keep callback ref current
  onAgentClickRef.current = onAgentClick;

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const engine = new PixelOfficeEngine(canvas);
    engineRef.current = engine;

    // Register click handler
    engine.onAgentClick((agentId) => {
      onAgentClickRef.current?.(agentId);
    });

    // Start engine (async -- loads assets)
    engine.start().then(() => {
      if (cancelled) {
        engine.stop();
      }
    }).catch((err) => {
      console.error('Failed to start PixelOfficeEngine:', err);
    });

    return () => {
      cancelled = true;
      engine.stop();
      engineRef.current = null;
      prevAgentIdsRef.current = new Set();
    };
  }, [canvasRef]);

  // Sync agents to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const currentIds = new Set(agents.keys());
    const prevIds = prevAgentIdsRef.current;

    // Add or update agents
    for (const [id, state] of agents) {
      if (prevIds.has(id)) {
        engine.updateAgent(state);
      } else {
        engine.addAgent(state);
      }
    }

    // Remove agents that are no longer present
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        engine.removeAgent(id);
      }
    }

    prevAgentIdsRef.current = currentIds;
  }, [agents]);

  // ResizeObserver for canvas container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engineRef.current?.resize(width, height);
        }
      }
    });

    resizeObserver.observe(parent);

    // Trigger initial resize
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      engineRef.current?.resize(rect.width, rect.height);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef]);

  const focusOnAgent = useCallback((id: string) => {
    engineRef.current?.focusOnAgent(id);
  }, []);

  return { focusOnAgent };
}
