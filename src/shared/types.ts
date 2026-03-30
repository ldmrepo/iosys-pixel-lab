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

/** 6-zone floor classification for the expanded 30x24 office */
export type FloorZone = 'corridor' | 'work' | 'lounge' | 'server' | 'meeting' | 'lobby';

/** Maps zone name to numeric spriteIndex used by TileMap.getZoneColor() */
export const ZONE_INDEX: Record<FloorZone, number> = {
  corridor: 0,
  work:     1,
  lounge:   2,
  server:   3,
  meeting:  4,
  lobby:    5,
};

export interface TileInfo {
  type: 'floor' | 'wall';
  walkable: boolean;
  spriteIndex: number;
  zone?: FloorZone;
}

// ─── Furniture Object Layer ───

export interface SpriteRegion {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface ObjectSpriteRef {
  sheetId: string;
  region: SpriteRegion;
}

export type FurnitureType =
  | 'desk' | 'chair' | 'sofa' | 'bookshelf' | 'cabinet'
  | 'plant' | 'monitor' | 'lamp' | 'carpet' | 'painting'
  | 'appliance' | 'whiteboard' | 'water-cooler' | 'window' | 'door' | 'decoration'
  | 'server-rack' | 'fireplace' | 'reception-desk';

export interface FurnitureObject {
  id: string;
  type: FurnitureType;
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
  walkableMask?: boolean[];
  sprite: ObjectSpriteRef;
  drawOffsetY?: number;
  renderWidth?: number;   // display width in world pixels (overrides sprite region sw)
  renderHeight?: number;  // display height in world pixels (overrides sprite region sh)
  seatId?: string;
  sortY?: number;
  layer?: 'wall' | 'object';
}

export interface FurnitureSpriteSheet {
  url: string;
  name: string;
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
  furniture: FurnitureObject[];
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
  furnitureSheets?: Record<string, FurnitureSpriteSheet>;
}
