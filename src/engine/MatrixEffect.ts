/**
 * MatrixEffect — Column-by-column stagger reveal/hide animation.
 *
 * Spawn: columns appear left-to-right with random stagger offsets, alpha 0->1 over 300ms total.
 * Despawn: columns disappear left-to-right with random stagger offsets, alpha 1->0 over 300ms total.
 *
 * Each column has a random stagger offset (0 to STAGGER_RANGE_MS) that determines when it
 * starts its individual fade. The total effect duration is EFFECT_DURATION_MS + max stagger.
 */

export type EffectType = 'spawn' | 'despawn';

const EFFECT_DURATION_MS = 300;
const STAGGER_RANGE_MS = 100; // max random delay per column

export class MatrixEffect {
  private type: EffectType;
  private elapsed: number = 0;
  private totalDuration: number;
  private columnCount: number;
  private columnStaggerOffsets: number[]; // random ms offset per column
  private _isComplete: boolean = false;

  constructor(type: EffectType, spriteWidth: number) {
    this.type = type;
    // Each column is 1 pixel wide in sprite space; group into ~4-8 columns for visible stagger
    this.columnCount = Math.max(4, Math.min(8, Math.floor(spriteWidth / 4)));

    // Generate random stagger offsets per column
    this.columnStaggerOffsets = [];
    let maxStagger = 0;
    for (let i = 0; i < this.columnCount; i++) {
      const offset = Math.random() * STAGGER_RANGE_MS;
      this.columnStaggerOffsets.push(offset);
      maxStagger = Math.max(maxStagger, offset);
    }
    this.totalDuration = EFFECT_DURATION_MS + maxStagger;
  }

  /** Advance the effect timer. Returns true when complete. */
  update(dtSeconds: number): boolean {
    if (this._isComplete) return true;
    this.elapsed += dtSeconds * 1000;
    if (this.elapsed >= this.totalDuration) {
      this._isComplete = true;
    }
    return this._isComplete;
  }

  get isComplete(): boolean {
    return this._isComplete;
  }

  /**
   * Get the alpha value for a specific column index.
   * Returns 0.0 to 1.0. During spawn, columns fade in; during despawn, columns fade out.
   */
  getColumnAlpha(columnIndex: number): number {
    if (this._isComplete) {
      return this.type === 'spawn' ? 1.0 : 0.0;
    }

    const stagger = this.columnStaggerOffsets[columnIndex] ?? 0;
    const columnElapsed = this.elapsed - stagger;

    if (columnElapsed <= 0) {
      return this.type === 'spawn' ? 0.0 : 1.0;
    }

    const progress = Math.min(columnElapsed / EFFECT_DURATION_MS, 1.0);

    if (this.type === 'spawn') {
      return progress; // 0 -> 1
    } else {
      return 1.0 - progress; // 1 -> 0
    }
  }

  get columns(): number {
    return this.columnCount;
  }
}
