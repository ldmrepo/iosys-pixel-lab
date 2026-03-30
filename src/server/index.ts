import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { AgentState, WSMessage } from '../shared/types.js';
import { SessionDiscovery, type DiscoveredSession } from './session-discovery.js';
import { JSONLWatcher } from './watcher.js';
import { AgentStateMachine } from './state-machine.js';
import type { AgentEvent } from '../shared/types.js';

const PORT = parseInt(process.env.PIXEL_OFFICE_PORT || '3333', 10);

// --- Initialize components ---

const discovery = new SessionDiscovery();
const watcher = new JSONLWatcher();
const stateMachine = new AgentStateMachine();

// --- Wire up event flow ---

// Session discovery -> Watcher + StateMachine
discovery.on('session-added', (session: DiscoveredSession) => {
  stateMachine.onSessionAdded(session);
  watcher.watchFile(session.jsonlPath, session.sessionId);
});

discovery.on('session-removed', (session: DiscoveredSession) => {
  stateMachine.onSessionRemoved(session);
  watcher.unwatchFile(session.sessionId);
});

// Watcher -> StateMachine
watcher.on('event', (event: AgentEvent) => {
  stateMachine.processEvent(event);
});

// --- Express server ---

const app = express();
const server = createServer(app);

// CORS for development
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    agents: stateMachine.getAgents().length,
    sessions: discovery.getActiveSessions().length,
  });
});

app.get('/api/agents', (_req, res) => {
  res.json(stateMachine.getAgents());
});

app.get('/api/sessions', (_req, res) => {
  res.json(discovery.getActiveSessions());
});

// --- WebSocket server ---

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Client connected');

  // Send current state snapshot
  const agents = stateMachine.getAgents();
  const initMessage: WSMessage = {
    type: 'agent-update',
    payload: agents,
  };
  ws.send(JSON.stringify(initMessage));

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
  });
});

/**
 * Broadcast a WSMessage to all connected clients.
 */
function broadcast(message: WSMessage): void {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// StateMachine -> WebSocket broadcast
stateMachine.on('agent-update', (agent: AgentState) => {
  broadcast({ type: 'agent-update', payload: agent });
});

stateMachine.on('agent-added', (agent: AgentState) => {
  broadcast({ type: 'agent-added', payload: agent });
});

stateMachine.on('agent-removed', (agent: AgentState) => {
  broadcast({ type: 'agent-removed', payload: agent });
});

// --- Start ---

server.listen(PORT, async () => {
  console.log(`[Server] Pixel Office backend running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`[Server] REST API: http://localhost:${PORT}/api/agents`);

  // Ensure office layout seats are loaded before discovering sessions
  await stateMachine.waitForLayout();

  // Start session discovery after server is listening
  discovery.start();
  stateMachine.start();
});

// --- Graceful shutdown ---

async function shutdown(): Promise<void> {
  console.log('\n[Server] Shutting down...');

  discovery.stop();
  stateMachine.stop();
  await watcher.stopAll();

  wss.close();
  server.close();

  console.log('[Server] Goodbye.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
