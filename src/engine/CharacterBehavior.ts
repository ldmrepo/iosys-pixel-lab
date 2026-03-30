/**
 * CharacterBehavior — 3-State FSM for character movement.
 *
 * Based on Pixel Agents / AgentRoom patterns:
 *   WORK  → sitting at work desk (typing/reading animation)
 *   WALK  → moving along BFS path to a destination
 *   IDLE  → standing still, waiting for wander timer or activation
 *
 * Flow:
 *   Agent becomes active (typing/reading/executing)
 *     → WALK to workSeat → arrive → WORK
 *   Agent becomes inactive (idle/waiting/done)
 *     → after seatDelay → WALK to break area → arrive → IDLE
 *   While IDLE:
 *     → wander timer fires → WALK to random walkable tile → arrive → IDLE
 *     → after wanderCount reaches limit → WALK back to workSeat → rest
 */

import type { AgentStatus } from '../shared/types';

export type BehaviorState = 'work' | 'walk' | 'idle';

/** Statuses that mean the agent is actively working. */
const ACTIVE_STATUSES: Set<AgentStatus> = new Set([
  'typing', 'reading', 'executing',
]);

/** Wander timing constants (Pixel Agents levels). */
const WANDER_PAUSE_MIN = 2;    // seconds
const WANDER_PAUSE_MAX = 20;   // seconds
const WANDER_MOVES_MIN = 3;    // moves before rest
const WANDER_MOVES_MAX = 6;
const SEAT_REST_MIN = 120;     // seconds
const SEAT_REST_MAX = 240;     // seconds
const SEAT_LEAVE_MIN = 2;      // seconds
const SEAT_LEAVE_MAX = 5;      // seconds

/** Randomize a value between min and max. */
function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface BehaviorConfig {
  /** Work seat tile position. */
  workSeat: { x: number; y: number };
  /** List of break area tile positions (rug, lounge). */
  breakTiles: { x: number; y: number }[];
  /** List of all walkable tile positions (for wander). */
  walkableTiles: { x: number; y: number }[];
  /** Callback: request path from current position to target tile. */
  requestPath: (targetX: number, targetY: number) => void;
}

export class CharacterBehavior {
  state: BehaviorState = 'idle';

  private config: BehaviorConfig;

  /** Whether the agent is actively working (from server status). */
  private isActive: boolean = false;

  /** Timer: delay before leaving work seat after becoming inactive. */
  private seatLeaveTimer: number = 0;
  private readonly seatLeaveDelay: number = randRange(SEAT_LEAVE_MIN, SEAT_LEAVE_MAX); // seconds

  /** Timer: delay before next wander while idle. */
  private wanderTimer: number = 0;
  private wanderPause: number = randRange(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX); // seconds

  /** Count wanders before returning to seat for rest. */
  private wanderCount: number = 0;
  private wanderLimit: number = Math.floor(randRange(WANDER_MOVES_MIN, WANDER_MOVES_MAX));

  /** Timer: rest at seat after wander cycle. */
  private seatRestTimer: number = 0;
  private readonly seatRestDuration: number = randRange(SEAT_REST_MIN, SEAT_REST_MAX); // seconds
  private isResting: boolean = false;

  /** Current walk destination type. */
  private walkTarget: 'work' | 'break' | 'wander' | 'rest' | null = null;

  constructor(config: BehaviorConfig) {
    this.config = config;
  }

  /** Update config (e.g. when seats change). */
  updateConfig(config: Partial<BehaviorConfig>): void {
    Object.assign(this.config, config);
  }

  /** Called when server status changes. */
  onStatusChange(status: AgentStatus): void {
    const wasActive = this.isActive;
    this.isActive = ACTIVE_STATUSES.has(status);

    if (this.isActive && !wasActive) {
      // Became active → go to work
      this.goToWork();
    } else if (!this.isActive && wasActive) {
      // Became inactive → start seat leave timer
      this.seatLeaveTimer = this.seatLeaveDelay;
    }
  }

  /** Called every frame. Returns true if a path request was made. */
  update(dt: number): void {
    switch (this.state) {
      case 'work':
        this.updateWork(dt);
        break;
      case 'idle':
        this.updateIdle(dt);
        break;
      case 'walk':
        // Walk state is driven externally (Character.updateMovement)
        // Nothing to do here — wait for onArrived() callback
        break;
    }
  }

  /** Called when character arrives at walk destination. */
  onArrived(): void {
    if (this.state !== 'walk') return;

    switch (this.walkTarget) {
      case 'work':
        this.state = 'work';
        this.seatLeaveTimer = 0;
        this.isResting = false;
        break;
      case 'break':
      case 'wander':
        this.state = 'idle';
        this.wanderTimer = randRange(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX);
        break;
      case 'rest':
        this.state = 'work';
        this.isResting = true;
        this.seatRestTimer = this.seatRestDuration;
        this.wanderCount = 0;
        this.wanderLimit = Math.floor(randRange(WANDER_MOVES_MIN, WANDER_MOVES_MAX));
        break;
    }
    this.walkTarget = null;
  }

  /** Whether the character should play work animation (typing/reading). */
  get shouldPlayWorkAnim(): boolean {
    return this.state === 'work' && this.isActive;
  }

  /** Whether the character is walking. */
  get isWalking(): boolean {
    return this.state === 'walk';
  }

  // --- Private state handlers ---

  private updateWork(dt: number): void {
    if (this.isActive) {
      // Active at desk → stay, reset timers
      this.seatLeaveTimer = 0;
      return;
    }

    if (this.isResting) {
      // Resting at seat after wander cycle
      this.seatRestTimer -= dt;
      if (this.seatRestTimer <= 0) {
        this.isResting = false;
        this.goToBreak();
      }
      return;
    }

    // Inactive at desk → count down to leave
    this.seatLeaveTimer -= dt;
    if (this.seatLeaveTimer <= 0) {
      this.goToBreak();
    }
  }

  private updateIdle(dt: number): void {
    if (this.isActive) {
      // Reactivated while idle → go to work immediately
      this.goToWork();
      return;
    }

    // Count down wander timer
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderCount++;
      if (this.wanderCount >= this.wanderLimit) {
        // Enough wandering → go rest at seat
        this.goToRest();
      } else {
        this.goToWander();
      }
    }
  }

  private goToWork(): void {
    this.state = 'walk';
    this.walkTarget = 'work';
    this.config.requestPath(this.config.workSeat.x, this.config.workSeat.y);
  }

  private goToBreak(): void {
    const { breakTiles } = this.config;
    if (breakTiles.length === 0) {
      // No break tiles → wander instead
      this.goToWander();
      return;
    }
    const target = breakTiles[Math.floor(Math.random() * breakTiles.length)];
    this.state = 'walk';
    this.walkTarget = 'break';
    this.config.requestPath(target.x, target.y);
  }

  private goToWander(): void {
    const { walkableTiles } = this.config;
    if (walkableTiles.length === 0) {
      this.wanderTimer = randRange(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX);
      return;
    }
    const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    this.state = 'walk';
    this.walkTarget = 'wander';
    this.config.requestPath(target.x, target.y);
  }

  private goToRest(): void {
    this.state = 'walk';
    this.walkTarget = 'rest';
    this.config.requestPath(this.config.workSeat.x, this.config.workSeat.y);
  }
}
