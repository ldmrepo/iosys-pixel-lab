/**
 * PathFinder — BFS-based shortest path search on a 2D tile grid.
 *
 * Operates on a walkability function to determine traversable tiles.
 * Returns an array of {x, y} tile coordinates from start to end (inclusive).
 */

export interface PathNode {
  x: number;
  y: number;
}

export class PathFinder {
  private width: number;
  private height: number;
  private isWalkableFn: (x: number, y: number) => boolean;

  /**
   * @param width - Grid width in tiles
   * @param height - Grid height in tiles
   * @param isWalkableFn - Function that returns true if a tile is walkable
   */
  constructor(
    width: number,
    height: number,
    isWalkableFn: (x: number, y: number) => boolean
  ) {
    this.width = width;
    this.height = height;
    this.isWalkableFn = isWalkableFn;
  }

  /** Update the walkability function (e.g. when layout changes). */
  setWalkable(fn: (x: number, y: number) => boolean): void {
    this.isWalkableFn = fn;
  }

  /**
   * Find shortest path from (startX, startY) to (endX, endY) using BFS.
   * 4-directional movement: up, down, left, right.
   *
   * @returns Array of {x, y} tile coordinates from start to end (inclusive).
   *          Returns empty array if no path exists.
   */
  findPath(startX: number, startY: number, endX: number, endY: number): PathNode[] {
    // Bounds check
    if (!this.inBounds(startX, startY) || !this.inBounds(endX, endY)) {
      return [];
    }

    // Start or end is not walkable — allow destination to be the target
    // (character will stand adjacent or on a chair tile)
    if (!this.isWalkableFn(startX, startY)) {
      return [];
    }

    // Already at destination
    if (startX === endX && startY === endY) {
      return [{ x: startX, y: startY }];
    }

    // BFS
    const directions: [number, number][] = [
      [0, -1], // up
      [0, 1],  // down
      [-1, 0], // left
      [1, 0],  // right
    ];

    // visited[y][x]
    const visited: boolean[][] = Array.from({ length: this.height }, () =>
      new Array<boolean>(this.width).fill(false)
    );

    // parent map for path reconstruction: key = "x,y", value = parent "x,y"
    const parent = new Map<string, string>();

    const queue: PathNode[] = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    const key = (x: number, y: number) => `${x},${y}`;

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;

        if (!this.inBounds(nx, ny)) continue;
        if (visited[ny][nx]) continue;

        // Allow moving onto the destination even if it's not walkable
        // (e.g. a chair tile that is the seat)
        if (!this.isWalkableFn(nx, ny) && !(nx === endX && ny === endY)) {
          continue;
        }

        visited[ny][nx] = true;
        parent.set(key(nx, ny), key(current.x, current.y));

        if (nx === endX && ny === endY) {
          found = true;
          break;
        }

        queue.push({ x: nx, y: ny });
      }

      if (found) break;
    }

    if (!found) {
      return [];
    }

    // Reconstruct path from end to start
    const path: PathNode[] = [];
    let cur = key(endX, endY);
    const startKey = key(startX, startY);

    while (cur !== startKey) {
      const [cx, cy] = cur.split(',').map(Number);
      path.push({ x: cx, y: cy });
      const p = parent.get(cur);
      if (!p) break;
      cur = p;
    }
    path.push({ x: startX, y: startY });
    path.reverse();

    return path;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
