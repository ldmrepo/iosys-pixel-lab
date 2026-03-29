import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DiscoveredSession {
  sessionId: string;
  projectPath: string;
  projectHash: string;
  jsonlPath: string;
  lastModified: number;
}

/**
 * Scans ~/.claude/projects/ for active Claude Code sessions.
 * Active = JSONL file modified within the last 5 minutes.
 * Re-scans every 10 seconds.
 */
export class SessionDiscovery extends EventEmitter {
  private claudeProjectsDir: string;
  private activeSessions: Map<string, DiscoveredSession> = new Map();
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private activeThresholdMs = 5 * 60 * 1000; // 5 minutes
  private scanIntervalMs = 10 * 1000; // 10 seconds

  constructor() {
    super();
    this.claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  }

  start(): void {
    // Initial scan
    this.scan();
    // Periodic re-scan
    this.scanInterval = setInterval(() => this.scan(), this.scanIntervalMs);
    console.log(`[SessionDiscovery] Watching ${this.claudeProjectsDir} (every ${this.scanIntervalMs / 1000}s)`);
  }

  stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  getActiveSessions(): DiscoveredSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Convert a project hash back to a human-readable project path.
   * Note: dashes in original dir names are indistinguishable from separators,
   * so the decoded path may not be exact. The hash itself is authoritative.
   * e.g. "-Users-ldm-work-my-project" -> "/Users/ldm/work/my-project"
   */
  private hashToProjectPath(hash: string): string {
    return hash.replace(/-/g, '/');
  }

  /**
   * Extract a short project name from the hash.
   * Uses the portion after the last known path separator pattern (work-, projects-, etc.).
   * e.g. "-Users-ldm-work-iosys-pixel-lab" -> "iosys-pixel-lab"
   *       "-Users-ldm-work-my-project"     -> "my-project"
   */
  static projectNameFromPath(projectPathOrHash: string): string {
    // Try to find "work-" or similar common parent dir patterns in the hash
    const hash = projectPathOrHash.startsWith('-') ? projectPathOrHash : projectPathOrHash.replace(/\//g, '-');

    // Common patterns: -Users-xxx-work-{project}, -home-xxx-projects-{project}
    const workMatch = hash.match(/-work-(.+)$/);
    if (workMatch) return workMatch[1];

    const projectsMatch = hash.match(/-projects-(.+)$/);
    if (projectsMatch) return projectsMatch[1];

    // Fallback: last segment after splitting on /
    const parts = projectPathOrHash.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }

  private scan(): void {
    const now = Date.now();
    const foundSessionIds = new Set<string>();

    try {
      if (!fs.existsSync(this.claudeProjectsDir)) {
        // Claude projects dir doesn't exist yet -- that's fine
        this.removeStaleSessionsExcept(foundSessionIds);
        return;
      }

      const projectHashes = fs.readdirSync(this.claudeProjectsDir, { withFileTypes: true });

      for (const entry of projectHashes) {
        if (!entry.isDirectory()) continue;

        const projectHash = entry.name;
        const projectDir = path.join(this.claudeProjectsDir, projectHash);
        const projectPath = this.hashToProjectPath(projectHash);

        try {
          this.scanProjectDir(projectDir, projectHash, projectPath, now, foundSessionIds);
        } catch {
          // Permission denied or other FS error -- skip this project
        }
      }
    } catch {
      // claudeProjectsDir not readable -- return empty
    }

    this.removeStaleSessionsExcept(foundSessionIds);
  }

  private scanProjectDir(
    projectDir: string,
    projectHash: string,
    projectPath: string,
    now: number,
    foundSessionIds: Set<string>,
  ): void {
    // JSONL files are directly in the project hash directory: {hash}/{session-id}.jsonl
    const entries = fs.readdirSync(projectDir, { withFileTypes: true });

    for (const file of entries) {
      if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;

      const jsonlPath = path.join(projectDir, file.name);
      const sessionId = file.name.replace('.jsonl', '');

      try {
        const stat = fs.statSync(jsonlPath);
        const lastModified = stat.mtimeMs;

        if (now - lastModified > this.activeThresholdMs) {
          // Not active -- skip
          continue;
        }

        foundSessionIds.add(sessionId);

        const existing = this.activeSessions.get(sessionId);
        if (!existing) {
          // New session discovered
          const session: DiscoveredSession = {
            sessionId,
            projectPath,
            projectHash,
            jsonlPath,
            lastModified,
          };
          this.activeSessions.set(sessionId, session);
          this.emit('session-added', session);
          console.log(`[SessionDiscovery] New session: ${sessionId} (${SessionDiscovery.projectNameFromPath(projectPath)})`);
        } else {
          // Update last modified time
          existing.lastModified = lastModified;
        }
      } catch {
        // stat failed -- skip
      }
    }
  }

  private removeStaleSessionsExcept(activeIds: Set<string>): void {
    for (const [sessionId, session] of this.activeSessions) {
      if (!activeIds.has(sessionId)) {
        this.activeSessions.delete(sessionId);
        this.emit('session-removed', session);
        console.log(`[SessionDiscovery] Session ended: ${sessionId}`);
      }
    }
  }
}
