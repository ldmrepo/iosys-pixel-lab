export type AgentStatus = 'idle' | 'typing' | 'reading' | 'executing' | 'waiting' | 'done' | 'error';

export interface AgentEvent {
  timestamp: number;
  sessionId: string;
  type: string;
  content: string;
  raw: unknown;
}

export interface AgentState {
  id: string;
  name: string;
  sessionId: string;
  status: AgentStatus;
  lastAction: string;
  lastUpdated: number;
  position: { x: number; y: number };
}

export interface WSMessage {
  type: 'agent-update' | 'agent-added' | 'agent-removed';
  payload: AgentState | AgentState[];
}

export interface TileInfo {
  type: 'floor' | 'wall' | 'desk' | 'chair' | 'decoration';
  walkable: boolean;
  spriteIndex: number;
}

export interface Seat {
  id: string;
  tileX: number;
  tileY: number;
  deskTileX: number;
  deskTileY: number;
  facing: 'down' | 'left' | 'right' | 'up';
  assignedAgentId?: string;
}

export interface OfficeLayout {
  width: number;
  height: number;
  tileSize: number;
  tiles: TileInfo[][];
  seats: Seat[];
}

export interface SpriteAnimation {
  frames: number[];
  fps: number;
  loop: boolean;
}

export interface CharacterSprite {
  sheetUrl: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<AgentStatus, SpriteAnimation>;
}

export interface AssetManifest {
  tileSheet: { url: string; tileSize: number; columns: number };
  characters: Record<string, CharacterSprite>;
}
