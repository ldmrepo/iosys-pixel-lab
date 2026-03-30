/**
 * Character — Visual representation of an AI agent in the pixel office.
 *
 * Receives AgentState and converts it into sprite animation, position interpolation,
 * name labels, and status speech bubbles.
 *
 * Sprite sheet layout (4 columns x 11 rows):
 *   Row  0: idle       [0,1]             fps:2
 *   Row  1: typing     [4,5,6,7]         fps:8
 *   Row  2: reading    [8,9]             fps:3
 *   Row  3: executing  [12,13,14,15]     fps:6
 *   Row  4: waiting    [16,17]           fps:2
 *   Row  5: done       [20,21]           fps:1
 *   Row  6: error      [24,25]           fps:4
 *   Row  7: walk_down  [28,29,30,31]     fps:8
 *   Row  8: walk_up    [32,33,34,35]     fps:8
 *   Row  9: walk_right [36,37,38,39]     fps:8
 *   Row 10: walk_left  [40,41,42,43]     fps:8
 */

import type { AgentState, AgentStatus, SpriteAnimation } from '../shared/types';
import { SpriteSheet } from './SpriteSheet';
import { Camera } from './Camera';
import type { PathNode } from './PathFinder';
import { CharacterBehavior, type BehaviorConfig } from './CharacterBehavior';

/** Default animation definitions matching the sprite sheet layout spec. */
const DEFAULT_ANIMATIONS: Record<AgentStatus, SpriteAnimation> = {
  idle:       { frames: [0, 1],           fps: 2,  loop: true },
  typing:     { frames: [4, 5, 6, 7],     fps: 8,  loop: true },
  reading:    { frames: [8, 9],           fps: 3,  loop: true },
  executing:  { frames: [12, 13, 14, 15], fps: 6,  loop: true },
  waiting:    { frames: [16, 17],         fps: 2,  loop: true },
  done:       { frames: [20, 21],         fps: 1,  loop: true },
  error:      { frames: [24, 25],         fps: 4,  loop: true },
  walk_down:  { frames: [28, 29, 30, 31], fps: 8,  loop: true },
  walk_up:    { frames: [32, 33, 34, 35], fps: 8,  loop: true },
  walk_right: { frames: [36, 37, 38, 39], fps: 8,  loop: true },
  walk_left:  { frames: [40, 41, 42, 43], fps: 8,  loop: true },
};

/** Movement speed in tiles per second. */
const MOVE_SPEED = 3;

export class Character {
  /** Agent data from server. */
  state: AgentState;

  /** Sprite sheet for this character. */
  private spriteSheet: SpriteSheet;

  /** Animation definitions (from CharacterSprite or defaults). */
  private animations: Record<AgentStatus, SpriteAnimation>;

  /** Current animation timing. */
  private animTime: number = 0;
  private currentFrameIndex: number = 0;
  private previousStatus: AgentStatus;

  /** World-space position (pixels). Interpolated smoothly toward target. */
  worldX: number;
  worldY: number;

  /** Tile size in pixels, used for position calculations. */
  private tileSize: number;

  /** Movement path: list of tile coordinates from PathFinder. */
  private path: PathNode[] = [];
  private pathIndex: number = 0;

  /** Global time accumulator for bubble animation. */
  private globalTime: number = 0;

  /** Current facing direction, updated during path movement. */
  private currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';

  /** Behavior FSM (optional — requires setBehavior call). */
  private behavior: CharacterBehavior | null = null;

  constructor(
    state: AgentState,
    spriteSheet: SpriteSheet,
    tileSize: number,
    animations?: Record<AgentStatus, SpriteAnimation>
  ) {
    this.state = state;
    this.spriteSheet = spriteSheet;
    this.tileSize = tileSize;
    this.animations = animations ?? DEFAULT_ANIMATIONS;
    this.previousStatus = state.status;

    // Initialize world position from state tile position
    this.worldX = state.position.x * tileSize + tileSize / 2;
    this.worldY = state.position.y * tileSize + tileSize / 2;
  }

  /** Initialize behavior FSM with office context. */
  setBehavior(config: BehaviorConfig): void {
    this.behavior = new CharacterBehavior(config);
    this.behavior.onStatusChange(this.state.status);
  }

  /** Get the behavior FSM (if set). */
  getBehavior(): CharacterBehavior | null {
    return this.behavior;
  }

  /** Update agent state from server. */
  updateState(newState: AgentState): void {
    const oldStatus = this.state.status;
    this.state = newState;

    // Reset animation timer on status change
    if (newState.status !== oldStatus) {
      this.animTime = 0;
      this.currentFrameIndex = 0;
      this.previousStatus = oldStatus;

      // Notify behavior FSM of status change
      if (this.behavior) {
        this.behavior.onStatusChange(newState.status);
      }
    }
  }

  /** Set a movement path for the character to follow. */
  setPath(path: PathNode[]): void {
    if (path.length === 0) return;
    this.path = path;
    this.pathIndex = 0;
  }

  /** Whether the character is currently moving along a path. */
  get isMoving(): boolean {
    return this.path.length > 0 && this.pathIndex < this.path.length;
  }

  /**
   * Update character: animation timing + position interpolation.
   * @param dt - Delta time in seconds.
   */
  update(dt: number): void {
    this.globalTime += dt;

    // Update behavior FSM
    if (this.behavior) {
      this.behavior.update(dt);
    }

    // Determine which animation to play
    const effectiveStatus = this.getEffectiveStatus();
    const anim = this.animations[effectiveStatus];
    if (anim && anim.frames.length > 0) {
      this.animTime += dt;
      const frameDuration = 1 / anim.fps;
      const totalDuration = frameDuration * anim.frames.length;

      if (anim.loop) {
        this.animTime = this.animTime % totalDuration;
      } else {
        this.animTime = Math.min(this.animTime, totalDuration - 0.001);
      }

      this.currentFrameIndex = Math.floor(this.animTime / frameDuration);
      this.currentFrameIndex = Math.min(this.currentFrameIndex, anim.frames.length - 1);
    }

    // Update position along path
    this.updateMovement(dt);
  }

  /**
   * Determine the effective animation status considering behavior and direction.
   * When walking, return direction-specific walk_* animation.
   * When at work desk but inactive, show idle.
   */
  private getEffectiveStatus(): AgentStatus {
    if (!this.behavior) {
      // Non-behavior characters: use walk animation when moving along path
      if (this.isMoving) {
        switch (this.currentDirection) {
          case 'up':    return 'walk_up';
          case 'down':  return 'walk_down';
          case 'left':  return 'walk_left';
          case 'right': return 'walk_right';
        }
      }
      return this.state.status;
    }

    if (this.behavior.isWalking) {
      // Return direction-specific walk animation
      switch (this.currentDirection) {
        case 'up':    return 'walk_up';
        case 'down':  return 'walk_down';
        case 'left':  return 'walk_left';
        case 'right': return 'walk_right';
      }
    }
    if (this.behavior.shouldPlayWorkAnim) {
      return this.state.status; // Play the actual status animation
    }
    // At break or resting → idle animation
    if (this.behavior.state === 'idle') {
      return 'idle';
    }
    // At work desk but inactive (resting)
    if (this.behavior.state === 'work' && !this.behavior.shouldPlayWorkAnim) {
      return 'idle';
    }
    return this.state.status;
  }

  /** Move along the current path using tile-based interpolation. */
  private updateMovement(dt: number): void {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      // No active path — if we just finished one, notify behavior
      if (this.path.length > 0 && this.pathIndex >= this.path.length) {
        this.path = [];
        this.pathIndex = 0;
        if (this.behavior) {
          this.behavior.onArrived();
        }
      }

      // Lerp toward current position target (no path)
      const targetX = this.worldX;
      const targetY = this.worldY;
      // Just stay put — no forced snap to state.position when behavior is active
      if (!this.behavior) {
        const stateTargetX = this.state.position.x * this.tileSize + this.tileSize / 2;
        const stateTargetY = this.state.position.y * this.tileSize + this.tileSize / 2;
        const lerpFactor = 1 - Math.exp(-8 * dt);
        this.worldX += (stateTargetX - this.worldX) * lerpFactor;
        this.worldY += (stateTargetY - this.worldY) * lerpFactor;
        if (Math.abs(stateTargetX - this.worldX) < 0.5 && Math.abs(stateTargetY - this.worldY) < 0.5) {
          this.worldX = stateTargetX;
          this.worldY = stateTargetY;
        }
      }
      return;
    }

    // Move toward current path waypoint
    const target = this.path[this.pathIndex];
    const targetX = target.x * this.tileSize + this.tileSize / 2;
    const targetY = target.y * this.tileSize + this.tileSize / 2;

    const dx = targetX - this.worldX;
    const dy = targetY - this.worldY;

    // Update facing direction based on movement delta
    if (Math.abs(dx) > Math.abs(dy)) {
      this.currentDirection = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      this.currentDirection = dy > 0 ? 'down' : 'up';
    }

    const dist = Math.sqrt(dx * dx + dy * dy);

    const step = MOVE_SPEED * this.tileSize * dt;

    if (dist <= step) {
      // Reached waypoint
      this.worldX = targetX;
      this.worldY = targetY;
      this.pathIndex++;
    } else {
      // Move toward waypoint
      this.worldX += (dx / dist) * step;
      this.worldY += (dy / dist) * step;
    }
  }

  /**
   * Render the character sprite, name label, and status bubble.
   * @param ctx - Canvas 2D context.
   * @param camera - Camera for coordinate transform.
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const effectiveStatus = this.getEffectiveStatus();
    const anim = this.animations[effectiveStatus];
    const frameIndex = anim ? anim.frames[this.currentFrameIndex] ?? anim.frames[0] : 0;

    // Character center in screen space
    const screen = camera.worldToScreen(this.worldX, this.worldY);

    const scale = camera.zoom;
    const fw = this.spriteSheet.frameWidth * scale;
    const fh = this.spriteSheet.frameHeight * scale;

    // Draw sprite bottom-center aligned: feet land on tile center.
    // worldX/worldY is the tile center. The sprite's horizontal center
    // aligns with screen.x, while its bottom edge aligns with the
    // bottom of the tile (screen.y + half a tile in screen space).
    const drawX = screen.x - fw / 2;
    const drawY = screen.y - fh + (this.tileSize * scale) / 2;

    if (this.spriteSheet.isLoaded) {
      this.spriteSheet.drawFrame(ctx, frameIndex, drawX, drawY, scale);
    } else {
      // Fallback: draw a colored rectangle
      this.renderFallback(ctx, screen.x, screen.y, scale);
    }

    // Name label above character
    this.renderNameLabel(ctx, screen.x, drawY, scale);

    // Status bubble for waiting/done/error
    this.renderStatusBubble(ctx, screen.x, drawY, scale);
  }

  /** Render a colored rectangle placeholder when sprite is not loaded. */
  private renderFallback(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number
  ): void {
    const fw = this.spriteSheet.frameWidth * scale;
    const fh = this.spriteSheet.frameHeight * scale;

    // Bottom-center aligned, matching the sprite draw position
    const drawX = cx - fw / 2;
    const drawY = cy - fh + (this.tileSize * scale) / 2;

    ctx.fillStyle = this.getStatusColor(this.state.status);
    ctx.fillRect(
      Math.round(drawX),
      Math.round(drawY),
      Math.round(fw),
      Math.round(fh)
    );

    // Draw a small face centered in the upper portion of the rect
    ctx.fillStyle = '#ffffff';
    const eyeSize = Math.max(2, 2 * scale);
    const faceCenterX = cx;
    const faceCenterY = drawY + fh * 0.35;
    // Left eye
    ctx.fillRect(
      Math.round(faceCenterX - fw * 0.15 - eyeSize / 2),
      Math.round(faceCenterY - eyeSize / 2),
      eyeSize,
      eyeSize
    );
    // Right eye
    ctx.fillRect(
      Math.round(faceCenterX + fw * 0.15 - eyeSize / 2),
      Math.round(faceCenterY - eyeSize / 2),
      eyeSize,
      eyeSize
    );
  }

  /** Render name label above the character. */
  private renderNameLabel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    topY: number,
    scale: number
  ): void {
    const labelY = topY - 4 * scale;
    const fontSize = Math.max(6, Math.round(5 * scale));

    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const name = this.state.name;
    const metrics = ctx.measureText(name);
    const padding = 2 * scale;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      Math.round(cx - metrics.width / 2 - padding),
      Math.round(labelY - fontSize - padding),
      Math.round(metrics.width + padding * 2),
      Math.round(fontSize + padding * 2)
    );

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, Math.round(cx), Math.round(labelY));
  }

  /** Render status speech bubble for waiting/done/error states. */
  private renderStatusBubble(
    ctx: CanvasRenderingContext2D,
    cx: number,
    topY: number,
    scale: number
  ): void {
    const status = this.state.status; // Use actual status for bubbles (not effective)
    if (status !== 'waiting' && status !== 'done' && status !== 'error') {
      return;
    }

    // Bounce animation offset
    const bounceY = Math.sin(this.globalTime * 3) * 1.5 * scale;
    const bubbleY = topY - 14 * scale + bounceY;

    const bubbleSize = Math.max(8, Math.round(8 * scale));
    const halfBubble = bubbleSize / 2;

    // Bubble background
    if (status === 'waiting') {
      ctx.fillStyle = '#ffd700'; // Yellow
    } else if (status === 'done') {
      ctx.fillStyle = '#32cd32'; // Green
    } else {
      // Error: blink between red and dark red
      const blink = Math.sin(this.globalTime * 8) > 0;
      ctx.fillStyle = blink ? '#ff4444' : '#cc0000';
    }

    // Draw rounded bubble
    this.drawRoundedRect(
      ctx,
      Math.round(cx - halfBubble),
      Math.round(bubbleY - halfBubble),
      bubbleSize,
      bubbleSize,
      3 * scale
    );
    ctx.fill();

    // Draw bubble pointer (small triangle)
    ctx.beginPath();
    ctx.moveTo(cx - 2 * scale, bubbleY + halfBubble);
    ctx.lineTo(cx, bubbleY + halfBubble + 3 * scale);
    ctx.lineTo(cx + 2 * scale, bubbleY + halfBubble);
    ctx.closePath();
    ctx.fill();

    // Draw icon text
    ctx.fillStyle = '#ffffff';
    const iconFontSize = Math.max(6, Math.round(6 * scale));
    ctx.font = `bold ${iconFontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (status === 'waiting') {
      ctx.fillText('?', Math.round(cx), Math.round(bubbleY));
    } else if (status === 'done') {
      // Checkmark
      ctx.fillText('\u2713', Math.round(cx), Math.round(bubbleY));
    } else {
      // Error exclamation
      ctx.fillText('!', Math.round(cx), Math.round(bubbleY));
    }
  }

  /** Draw a rounded rectangle path. */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** Get a representative color for the agent status (fallback rendering). */
  private getStatusColor(status: AgentStatus): string {
    switch (status) {
      case 'idle':      return '#6c8ebf';
      case 'typing':    return '#82b366';
      case 'reading':   return '#d6b656';
      case 'executing': return '#b85450';
      case 'waiting':   return '#f0c040';
      case 'done':      return '#67ab5b';
      case 'error':     return '#e05555';
      default:          return '#888888';
    }
  }

  /** Get the character's current tile position (rounded). */
  getTilePosition(): { x: number; y: number } {
    return {
      x: Math.round((this.worldX - this.tileSize / 2) / this.tileSize),
      y: Math.round((this.worldY - this.tileSize / 2) / this.tileSize),
    };
  }

  /** Check if a screen-space point hits this character. */
  hitTest(screenX: number, screenY: number, camera: Camera): boolean {
    const screen = camera.worldToScreen(this.worldX, this.worldY);
    const scale = camera.zoom;
    const fw = this.spriteSheet.frameWidth * scale;
    const fh = this.spriteSheet.frameHeight * scale;

    // Match the bottom-center aligned draw rect used in render()
    const drawX = screen.x - fw / 2;
    const drawY = screen.y - fh + (this.tileSize * scale) / 2;

    return (
      screenX >= drawX &&
      screenX <= drawX + fw &&
      screenY >= drawY &&
      screenY <= drawY + fh
    );
  }
}
