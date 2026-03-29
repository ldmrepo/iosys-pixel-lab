import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as chokidar from 'chokidar';
import { parseJSONLLine } from './parser.js';
import type { AgentEvent } from '../shared/types.js';

interface WatchedFile {
  path: string;
  sessionId: string;
  offset: number;
  watcher: chokidar.FSWatcher;
}

/**
 * Watches JSONL files for new content using chokidar.
 * Emits 'event' with AgentEvent for each new parsed line.
 * Uses tail-like approach: tracks byte offset per file.
 */
export class JSONLWatcher extends EventEmitter {
  private watchedFiles: Map<string, WatchedFile> = new Map();

  /**
   * Start watching a JSONL file for the given session.
   * Reads existing content from the end (no historical replay) unless replayExisting is true.
   */
  watchFile(jsonlPath: string, sessionId: string, replayExisting = false): void {
    if (this.watchedFiles.has(sessionId)) {
      return; // Already watching
    }

    let initialOffset = 0;
    if (!replayExisting) {
      try {
        const stat = fs.statSync(jsonlPath);
        initialOffset = stat.size;
      } catch {
        initialOffset = 0;
      }
    }

    const watcher = chokidar.watch(jsonlPath, {
      persistent: true,
      awaitWriteFinish: false,
      // Use polling with short interval for reliable change detection
      usePolling: true,
      interval: 300,
    });

    const entry: WatchedFile = {
      path: jsonlPath,
      sessionId,
      offset: initialOffset,
      watcher,
    };

    this.watchedFiles.set(sessionId, entry);

    watcher.on('change', () => {
      this.readNewContent(entry);
    });

    watcher.on('error', (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Watcher] Error watching ${jsonlPath}:`, message);
    });

    // If replaying, do an initial read
    if (replayExisting) {
      this.readNewContent(entry);
    }

    console.log(`[Watcher] Watching ${jsonlPath} (offset: ${initialOffset})`);
  }

  /**
   * Stop watching a specific session's JSONL file.
   */
  async unwatchFile(sessionId: string): Promise<void> {
    const entry = this.watchedFiles.get(sessionId);
    if (!entry) return;

    await entry.watcher.close();
    this.watchedFiles.delete(sessionId);
    console.log(`[Watcher] Stopped watching session ${sessionId}`);
  }

  /**
   * Stop all watchers.
   */
  async stopAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    for (const [sessionId, entry] of this.watchedFiles) {
      closePromises.push(entry.watcher.close());
      console.log(`[Watcher] Closing watcher for ${sessionId}`);
    }
    await Promise.all(closePromises);
    this.watchedFiles.clear();
  }

  /**
   * Read new content from a JSONL file starting from the tracked offset.
   */
  private readNewContent(entry: WatchedFile): void {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(entry.path);
    } catch {
      return; // File gone
    }

    const currentSize = stat.size;

    // Handle file truncation (file was rewritten/shrunk)
    if (currentSize < entry.offset) {
      console.log(`[Watcher] File truncated: ${entry.path}, resetting offset`);
      entry.offset = 0;
    }

    if (currentSize === entry.offset) {
      return; // No new data
    }

    // Read only the new bytes
    const bytesToRead = currentSize - entry.offset;
    const buffer = Buffer.alloc(bytesToRead);
    let fd: number | null = null;

    try {
      fd = fs.openSync(entry.path, 'r');
      fs.readSync(fd, buffer, 0, bytesToRead, entry.offset);
    } catch (err) {
      console.error(`[Watcher] Error reading ${entry.path}:`, err);
      return;
    } finally {
      if (fd !== null) {
        fs.closeSync(fd);
      }
    }

    entry.offset = currentSize;

    // Parse lines
    const newContent = buffer.toString('utf-8');
    const lines = newContent.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const event = parseJSONLLine(line, entry.sessionId);
      if (event) {
        this.emit('event', event);
      }
    }
  }
}
