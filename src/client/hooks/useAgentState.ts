import { useEffect, useRef, useState, useMemo } from 'react';
import type { AgentState, WSMessage } from '@shared/types';

interface UseAgentStateReturn {
  agents: Map<string, AgentState>;
  agentList: AgentState[];
}

export function useAgentState(lastMessage: WSMessage | null): UseAgentStateReturn {
  const [agents, setAgents] = useState<Map<string, AgentState>>(new Map());
  const prevMessageRef = useRef<WSMessage | null>(null);

  useEffect(() => {
    if (!lastMessage || lastMessage === prevMessageRef.current) return;
    prevMessageRef.current = lastMessage;

    const { type, payload } = lastMessage;

    setAgents((prev) => {
      const next = new Map(prev);

      switch (type) {
        case 'agent-update': {
          if (Array.isArray(payload)) {
            // Full state replace (initial sync)
            const fresh = new Map<string, AgentState>();
            for (const agent of payload) {
              fresh.set(agent.id, agent);
            }
            return fresh;
          }
          // Single agent update
          next.set(payload.id, payload);
          break;
        }
        case 'agent-added': {
          const agent = payload as AgentState;
          next.set(agent.id, agent);
          break;
        }
        case 'agent-removed': {
          const agent = payload as AgentState;
          next.delete(agent.id);
          break;
        }
      }

      return next;
    });
  }, [lastMessage]);

  const agentList = useMemo(() => Array.from(agents.values()), [agents]);

  return { agents, agentList };
}
