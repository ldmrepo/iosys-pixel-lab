/**
 * PixelOfficeEngine — Public API for the Canvas 2D game engine.
 *
 * This is the single entry point for the frontend-builder.
 * It orchestrates the game loop, tile map, characters, camera,
 * path finding, and input handling.
 *
 * Usage:
 *   const engine = new PixelOfficeEngine(canvasElement);
 *   engine.start();
 *   engine.addAgent(agentState);
 *   engine.updateAgent(agentState);
 */

import type {
  AgentState,
  AssetManifest,
  OfficeLayout,
  TileInfo,
  CharacterSprite,
  Seat,
} from '../shared/types';
import { GameLoop } from './GameLoop';
import { SpriteSheet } from './SpriteSheet';
import { Character } from './Character';
import { TileMap } from './TileMap';
import { PathFinder } from './PathFinder';
import { Camera } from './Camera';

// Re-export all engine modules for advanced usage
export { GameLoop } from './GameLoop';
export { SpriteSheet } from './SpriteSheet';
export { Character } from './Character';
export { TileMap } from './TileMap';
export { PathFinder } from './PathFinder';
export { Camera } from './Camera';
export { CharacterBehavior } from './CharacterBehavior';

// ─── Fallback defaults when shared modules are not yet available ───

const FALLBACK_MANIFEST: AssetManifest = {
  tileSheet: {
    url: '/assets/tileset.png',
    tileSize: 16,
    columns: 8,
  },
  characters: {
    default: {
      sheetUrl: '/assets/character-default.png',
      frameWidth: 32,
      frameHeight: 32,
      animations: {
        idle:      { frames: [0, 1],          fps: 2, loop: true },
        typing:    { frames: [4, 5, 6, 7],    fps: 8, loop: true },
        reading:   { frames: [8, 9],          fps: 3, loop: true },
        executing: { frames: [12, 13, 14, 15], fps: 6, loop: true },
        waiting:   { frames: [16, 17],        fps: 2, loop: true },
        done:      { frames: [20, 21],        fps: 1, loop: true },
        error:     { frames: [24, 25],        fps: 4, loop: true },
      },
    },
  },
};

const FALLBACK_SEATS: Seat[] = [
  { id: 'seat-0', tileX: 3, tileY: 3,  deskTileX: 3, deskTileY: 2,  facing: 'up' },
  { id: 'seat-1', tileX: 7, tileY: 3,  deskTileX: 7, deskTileY: 2,  facing: 'up' },
  { id: 'seat-2', tileX: 11, tileY: 3, deskTileX: 11, deskTileY: 2, facing: 'up' },
  { id: 'seat-3', tileX: 15, tileY: 3, deskTileX: 15, deskTileY: 2, facing: 'up' },
  { id: 'seat-4', tileX: 3, tileY: 8,  deskTileX: 3, deskTileY: 7,  facing: 'up' },
];

const FALLBACK_TILES = generateFallbackTiles(20, 15);
applyFallbackFurniture(FALLBACK_TILES, FALLBACK_SEATS, 15, 20);

const FALLBACK_LAYOUT: OfficeLayout = {
  width: 20,
  height: 15,
  tileSize: 16,
  tiles: FALLBACK_TILES,
  seats: FALLBACK_SEATS,
};

function generateFallbackTiles(w: number, h: number): TileInfo[][] {
  const tiles: TileInfo[][] = [];
  for (let y = 0; y < h; y++) {
    const row: TileInfo[] = [];
    for (let x = 0; x < w; x++) {
      const isWall = x === 0 || x === w - 1 || y === 0 || y === h - 1;
      row.push({
        type: isWall ? 'wall' : 'floor',
        walkable: !isWall,
        spriteIndex: isWall ? 1 : 0,
      });
    }
    tiles.push(row);
  }
  return tiles;
}

function applyFallbackFurniture(tiles: TileInfo[][], seats: Seat[], h: number, w: number): void {
  for (const seat of seats) {
    if (seat.deskTileY >= 0 && seat.deskTileY < h && seat.deskTileX >= 0 && seat.deskTileX < w) {
      tiles[seat.deskTileY][seat.deskTileX] = { type: 'desk', walkable: false, spriteIndex: 2 };
    }
    if (seat.tileY >= 0 && seat.tileY < h && seat.tileX >= 0 && seat.tileX < w) {
      tiles[seat.tileY][seat.tileX] = { type: 'chair', walkable: true, spriteIndex: 3 };
    }
  }
}

export class PixelOfficeEngine {
  // ─── Core systems ───
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameLoop: GameLoop;
  private camera: Camera;
  private tileMap!: TileMap;
  private pathFinder!: PathFinder;

  // ─── Sprite sheets ───
  private tileSpriteSheet!: SpriteSheet;
  private characterSpriteSheets: Map<string, SpriteSheet> = new Map();

  // ─── Characters ───
  private characters: Map<string, Character> = new Map();

  // ─── Assets/Layout ───
  private manifest: AssetManifest = FALLBACK_MANIFEST;
  private layout: OfficeLayout = FALLBACK_LAYOUT;

  // ─── Input handling ───
  private agentClickCallbacks: Array<(agentId: string) => void> = [];
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  // ─── State ───
  private initialized: boolean = false;

  // ─── Pending agents (queued before initialization) ───
  private pendingAgents: AgentState[] = [];

  // ─── Cached tile lists for behavior ───
  private walkableTiles: { x: number; y: number }[] = [];
  private breakTiles: { x: number; y: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get Canvas 2D context');
    }
    this.ctx = ctx;

    // Setup camera with current canvas size
    this.camera = new Camera(canvas.width, canvas.height);

    // Setup game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );

    // Setup input handlers
    this.setupInputHandlers();
  }

  /**
   * Initialize and start the engine.
   * Loads assets dynamically and begins the game loop.
   */
  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    this.gameLoop.start();
  }

  /** Stop the game loop. */
  stop(): void {
    this.gameLoop.stop();
  }

  /** Update an existing agent's state. */
  updateAgent(state: AgentState): void {
    if (!this.initialized) {
      // Queue until engine is ready
      const idx = this.pendingAgents.findIndex(a => a.id === state.id);
      if (idx >= 0) this.pendingAgents[idx] = state;
      else this.pendingAgents.push(state);
      return;
    }

    const character = this.characters.get(state.id);
    if (character) {
      const oldPos = character.getTilePosition();
      character.updateState(state);

      // If position changed, compute a new path
      const newTileX = state.position.x;
      const newTileY = state.position.y;
      if (oldPos.x !== newTileX || oldPos.y !== newTileY) {
        const path = this.pathFinder.findPath(oldPos.x, oldPos.y, newTileX, newTileY);
        if (path.length > 1) {
          character.setPath(path);
        }
      }
    } else {
      // Agent not found, auto-add
      this.addAgent(state);
    }
  }

  /** Add a new agent to the scene. */
  addAgent(state: AgentState): void {
    if (!this.initialized) {
      // Queue until engine is ready
      if (!this.pendingAgents.find(a => a.id === state.id)) {
        this.pendingAgents.push(state);
      }
      return;
    }

    if (this.characters.has(state.id)) {
      // Already exists, just update
      this.updateAgent(state);
      return;
    }

    // Get or create sprite sheet for this character
    const spriteSheet = this.getCharacterSpriteSheet(state.id);
    const charSprite = this.manifest.characters[state.id] ?? this.manifest.characters['default'];
    const animations = charSprite?.animations;

    const character = new Character(
      state,
      spriteSheet,
      this.layout.tileSize,
      animations
    );

    // Setup behavior FSM with office context
    if (this.initialized) {
      const workSeat = { x: state.position.x, y: state.position.y };
      character.setBehavior({
        workSeat,
        breakTiles: this.breakTiles,
        walkableTiles: this.walkableTiles,
        requestPath: (targetX: number, targetY: number) => {
          const currentTile = character.getTilePosition();
          const path = this.pathFinder.findPath(currentTile.x, currentTile.y, targetX, targetY);
          if (path.length > 1) {
            character.setPath(path);
          } else {
            // No path or already there — notify arrival immediately
            const behavior = character.getBehavior();
            if (behavior) behavior.onArrived();
          }
        },
      });
    }

    this.characters.set(state.id, character);
  }

  /** Remove an agent from the scene. */
  removeAgent(id: string): void {
    this.characters.delete(id);
  }

  /** Smoothly focus the camera on a specific agent. */
  focusOnAgent(id: string): void {
    const character = this.characters.get(id);
    if (character) {
      this.camera.focusOn(character.worldX, character.worldY);
    }
  }

  /** Register a callback for when an agent is clicked. */
  onAgentClick(callback: (agentId: string) => void): void {
    this.agentClickCallbacks.push(callback);
  }

  /** Resize the canvas and update the camera viewport. */
  resize(width: number, height: number): void {
    // Handle device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Scale context for DPR
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Update camera viewport (CSS pixel dimensions)
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }

  // ─── Getters for advanced usage ───

  getCamera(): Camera {
    return this.camera;
  }

  getTileMap(): TileMap | null {
    return this.tileMap ?? null;
  }

  getCharacter(id: string): Character | undefined {
    return this.characters.get(id);
  }

  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  // ─── Private: Initialization ───

  private async initialize(): Promise<void> {
    // Try to dynamically import shared modules
    await this.loadSharedModules();

    // Setup tile sprite sheet
    this.tileSpriteSheet = new SpriteSheet(
      this.manifest.tileSheet.url,
      this.manifest.tileSheet.tileSize,
      this.manifest.tileSheet.tileSize
    );

    // Load tile sprite sheet (don't block on failure)
    try {
      await this.tileSpriteSheet.load();
    } catch (e) {
      console.warn('Failed to load tile sprite sheet, using fallback rendering:', e);
    }

    // Setup tilemap
    this.tileMap = new TileMap(this.layout, this.tileSpriteSheet);

    // Setup pathfinder
    const gridSize = this.tileMap.getGridSize();
    this.pathFinder = new PathFinder(
      gridSize.width,
      gridSize.height,
      (x, y) => this.tileMap.isWalkable(x, y)
    );

    // Setup camera world bounds, center, and auto-fit zoom
    const worldSize = this.tileMap.getWorldSize();
    this.camera.setWorldBounds(worldSize.width, worldSize.height);
    this.camera.centerOn(worldSize.width / 2, worldSize.height / 2);

    // Auto-fit: zoom to fill viewport with some padding
    if (this.camera.viewportWidth > 0 && this.camera.viewportHeight > 0) {
      const padding = 0.9; // 90% fill
      const zoomX = (this.camera.viewportWidth * padding) / worldSize.width;
      const zoomY = (this.camera.viewportHeight * padding) / worldSize.height;
      const fitZoom = Math.min(zoomX, zoomY);
      this.camera.setZoom(Math.max(fitZoom, this.camera.minZoom));
    }

    // Pre-load character sprite sheets
    await this.preloadCharacterSprites();

    // Cache walkable and break tiles for character behavior
    this.cacheMovementTiles();

    this.initialized = true;

    // Process any agents that were queued before initialization
    for (const pendingState of this.pendingAgents) {
      this.addAgent(pendingState);
    }
    this.pendingAgents = [];
  }

  private async loadSharedModules(): Promise<void> {
    // Try loading asset manifest
    try {
      const manifestModule = await import('../shared/asset-manifest');
      // Support both naming conventions: camelCase and UPPER_SNAKE_CASE
      const manifest = manifestModule.assetManifest
        ?? (manifestModule as Record<string, unknown>).ASSET_MANIFEST;
      if (manifest) {
        this.manifest = manifest as AssetManifest;
      }
    } catch (e) {
      console.warn('Asset manifest not available, using fallback:', e);
    }

    // Try loading office layout
    try {
      const layoutModule = await import('../shared/office-layout');
      const layout = layoutModule.officeLayout
        ?? (layoutModule as Record<string, unknown>).OFFICE_LAYOUT;
      if (layout) {
        this.layout = layout as OfficeLayout;
      }
    } catch (e) {
      console.warn('Office layout not available, using fallback:', e);
    }
  }

  private async preloadCharacterSprites(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    for (const [key, charSprite] of Object.entries(this.manifest.characters)) {
      if (this.characterSpriteSheets.has(key)) continue;

      const sheet = new SpriteSheet(
        charSprite.sheetUrl,
        charSprite.frameWidth,
        charSprite.frameHeight
      );
      this.characterSpriteSheets.set(key, sheet);

      loadPromises.push(
        sheet.load().catch((e) => {
          console.warn(`Failed to load character sprite "${key}":`, e);
        })
      );
    }

    await Promise.all(loadPromises);
  }

  /**
   * Cache walkable tiles and break area tiles for character behavior.
   * Break tiles = rug/floor tiles in the central area (not near desks).
   */
  private cacheMovementTiles(): void {
    const { tiles, seats, width, height } = this.layout;

    // Collect desk tile positions for proximity check
    const deskPositions = new Set<string>();
    for (const seat of seats) {
      deskPositions.add(`${seat.deskTileX},${seat.deskTileY}`);
      deskPositions.add(`${seat.tileX},${seat.tileY}`);
    }

    this.walkableTiles = [];
    this.breakTiles = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y]?.[x];
        if (!tile || !tile.walkable) continue;

        this.walkableTiles.push({ x, y });

        // Break tiles: walkable tiles NOT near a desk (distance > 2)
        const posKey = `${x},${y}`;
        if (!deskPositions.has(posKey)) {
          let nearDesk = false;
          for (const seat of seats) {
            const dist = Math.abs(x - seat.deskTileX) + Math.abs(y - seat.deskTileY);
            if (dist <= 2) {
              nearDesk = true;
              break;
            }
          }
          if (!nearDesk) {
            this.breakTiles.push({ x, y });
          }
        }
      }
    }

    console.log(`[Engine] Cached ${this.walkableTiles.length} walkable tiles, ${this.breakTiles.length} break tiles`);
  }

  private getCharacterSpriteSheet(agentId: string): SpriteSheet {
    // Check if there's a specific sheet for this agent
    if (this.characterSpriteSheets.has(agentId)) {
      return this.characterSpriteSheets.get(agentId)!;
    }

    // Fall back to 'default' character sheet
    if (this.characterSpriteSheets.has('default')) {
      return this.characterSpriteSheets.get('default')!;
    }

    // Create and return a new default sheet
    const defaultChar = this.manifest.characters['default'];
    const sheet = new SpriteSheet(
      defaultChar?.sheetUrl ?? '/assets/character-default.png',
      defaultChar?.frameWidth ?? 32,
      defaultChar?.frameHeight ?? 32
    );
    this.characterSpriteSheets.set('default', sheet);

    // Attempt to load asynchronously
    sheet.load().catch(() => {
      // Fallback rendering will handle this
    });

    return sheet;
  }

  // ─── Private: Game loop callbacks ───

  private update(dt: number): void {
    // Update camera (smooth focus)
    this.camera.update(dt);

    // Update all characters
    for (const character of this.characters.values()) {
      character.update(dt);
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const cam = this.camera;

    // Clear the entire canvas
    ctx.clearRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    // Layer 1: Floor tiles (floor + wall)
    if (this.tileMap) {
      this.tileMap.render(ctx, cam);
    }

    // Layer 2: Furniture objects (desks, chairs, decorations)
    if (this.tileMap) {
      this.tileMap.renderObjects(ctx, cam);
    }

    // Layer 3: Characters (sorted by y position for depth)
    const sortedCharacters = Array.from(this.characters.values()).sort(
      (a, b) => a.worldY - b.worldY
    );
    for (const character of sortedCharacters) {
      character.render(ctx, cam);
    }
  }

  // ─── Private: Input handling ───

  private setupInputHandlers(): void {
    const canvas = this.canvas;

    // Mouse/pointer events for panning
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);

    // Wheel for zooming
    canvas.addEventListener('wheel', this.onWheel, { passive: false });

    // Click for agent selection
    canvas.addEventListener('click', this.onClick);

    // Touch support
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);
  }

  private getCanvasPoint(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return; // Only left click
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    this.camera.pan(dx, dy);
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.camera.setZoom(this.camera.zoom * zoomFactor);
  };

  private onClick = (e: MouseEvent): void => {
    if (this.agentClickCallbacks.length === 0) return;

    const point = this.getCanvasPoint(e);

    // Check all characters for hit
    for (const [id, character] of this.characters) {
      if (character.hitTest(point.x, point.y, this.camera)) {
        for (const cb of this.agentClickCallbacks) {
          cb(id);
        }
        return;
      }
    }
  };

  // ─── Touch support ───

  private lastTouchDist: number = 0;

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      this.isDragging = false;
      this.lastTouchDist = this.getTouchDistance(e.touches);
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.dragStartX;
      const dy = e.touches[0].clientY - this.dragStartY;
      this.camera.pan(dx, dy);
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = this.getTouchDistance(e.touches);
      if (this.lastTouchDist > 0) {
        const scale = dist / this.lastTouchDist;
        this.camera.setZoom(this.camera.zoom * scale);
      }
      this.lastTouchDist = dist;
    }
  };

  private onTouchEnd = (): void => {
    this.isDragging = false;
    this.lastTouchDist = 0;
  };

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
