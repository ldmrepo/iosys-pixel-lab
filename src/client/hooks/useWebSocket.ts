import { useEffect, useRef, useState, useCallback } from 'react';
import type { WSMessage } from '@shared/types';

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

interface UseWebSocketReturn {
  connectionState: ConnectionState;
  lastMessage: WSMessage | null;
}

const MAX_RETRIES = 10;
const RECONNECT_INTERVAL = 3000;

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    // Clean up previous connection
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    const url = getWebSocketUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) return;
      retriesRef.current = 0;
      setConnectionState('connected');
    };

    ws.onmessage = (event) => {
      if (unmountedRef.current) return;
      try {
        const msg: WSMessage = JSON.parse(event.data);
        setLastMessage(msg);
      } catch (e) {
        console.warn('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      wsRef.current = null;

      if (retriesRef.current < MAX_RETRIES) {
        setConnectionState('reconnecting');
        retriesRef.current += 1;
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_INTERVAL);
      } else {
        setConnectionState('disconnected');
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror, so we handle reconnection there
    };
  }, [clearReconnectTimer]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnectTimer]);

  return { connectionState, lastMessage };
}
