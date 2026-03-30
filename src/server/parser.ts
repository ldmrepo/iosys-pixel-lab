import type { AgentEvent } from '../shared/types.js';

/**
 * Represents a single content block inside an assistant message.
 */
interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  id?: string;
}

/**
 * Shape of a single JSONL line from Claude Code logs.
 * This is intentionally loose -- we only extract what we need.
 */
interface RawJSONLEntry {
  type?: string; // "user" | "assistant" | "tool_result" | "file-history-snapshot" | "system" | "progress"
  subtype?: string;  // e.g. 'turn_duration' for system type, 'queue-operation' for progress type
  message?: {
    role?: string;
    content?: string | ContentBlock[];
  };
  sessionId?: string;
  timestamp?: string;
  uuid?: string;
  // tool_result specific
  content?: string | ContentBlock[];
  name?: string;
  tool_use_id?: string;         // present in tool_result entries for lifecycle tracking
  // assistant specific -- tool_use at top level in some formats
  input?: Record<string, unknown>;
}

/**
 * Parse a single JSONL line into an AgentEvent.
 * Returns null if the line is malformed or not relevant.
 */
export function parseJSONLLine(line: string, fallbackSessionId: string): AgentEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let raw: RawJSONLEntry;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    // Malformed JSON line -- skip
    return null;
  }

  // Skip non-message types
  const entryType = raw.type;
  if (!entryType) return null;

  // Skip file-history-snapshot
  if (entryType === 'file-history-snapshot') {
    return null;
  }

  const sessionId = raw.sessionId || fallbackSessionId;
  const timestamp = raw.timestamp ? new Date(raw.timestamp).getTime() : Date.now();

  if (entryType === 'system') {
    // Parse turn_duration subtype — definitive turn end signal
    if (raw.subtype === 'turn_duration') {
      return {
        timestamp,
        sessionId,
        type: 'turn_end',
        content: 'turn_duration',
        raw,
      };
    }
    return null;
  }

  if (entryType === 'progress') {
    // queue-operation indicates background agent activity
    if (raw.subtype === 'queue-operation') {
      return {
        timestamp,
        sessionId,
        type: 'queue-operation',
        content: summarizeContent(raw.content),
        raw,
      };
    }
    return null;
  }

  if (entryType === 'assistant') {
    return parseAssistantEntry(raw, sessionId, timestamp);
  }

  if (entryType === 'user') {
    return parseUserEntry(raw, sessionId, timestamp);
  }

  if (entryType === 'tool_result') {
    return {
      timestamp,
      sessionId,
      type: 'tool_result',
      content: summarizeContent(raw.content),
      raw,
    };
  }

  return null;
}

function parseAssistantEntry(
  raw: RawJSONLEntry,
  sessionId: string,
  timestamp: number,
): AgentEvent | null {
  const content = raw.message?.content;
  if (!content || !Array.isArray(content)) return null;

  // An assistant message can contain multiple content blocks.
  // We pick the most interesting one for the event.
  // Priority: tool_use > text

  for (const block of content) {
    if (block.type === 'tool_use' && block.name) {
      const isBackground = block.name === 'Bash' &&
        block.input?.run_in_background === true;
      const isSubAgent = block.name === 'Task' || block.name === 'Agent';
      return {
        timestamp,
        sessionId,
        type: isBackground ? 'background-tool' : `tool_use:${block.name}`,
        content: summarizeToolUse(block.name, block.input),
        toolName: block.name,
        toolCallId: isSubAgent ? (block.id ?? undefined) : undefined,
        raw,
      };
    }
  }

  // Fall back to text content
  for (const block of content) {
    if (block.type === 'text' && block.text) {
      return {
        timestamp,
        sessionId,
        type: 'assistant_text',
        content: truncate(block.text, 120),
        raw,
      };
    }
  }

  return null;
}

function parseUserEntry(
  raw: RawJSONLEntry,
  sessionId: string,
  timestamp: number,
): AgentEvent | null {
  const content = raw.message?.content;
  if (!content) return null;

  // Skip meta/system user messages (commands, local-command-caveat, etc.)
  if (typeof content === 'string') {
    // Filter out internal meta messages
    if (content.includes('<local-command-caveat>') || content.includes('<command-name>') || content.includes('<local-command-stdout>')) {
      return null;
    }
    return {
      timestamp,
      sessionId,
      type: 'user',
      content: truncate(content, 120),
      raw,
    };
  }

  return null;
}

function summarizeToolUse(name: string, input?: Record<string, unknown>): string {
  if (!input) return name;

  switch (name) {
    case 'Read':
      return `Read ${input.file_path || ''}`;
    case 'Write':
      return `Write ${input.file_path || ''}`;
    case 'Edit':
      return `Edit ${input.file_path || ''}`;
    case 'Bash':
      return `Bash: ${truncate(String(input.command || input.description || ''), 80)}`;
    case 'Glob':
      return `Glob ${input.pattern || ''}`;
    case 'Grep':
      return `Grep ${input.pattern || ''}`;
    case 'Agent':
      return `Agent: ${truncate(String(input.prompt || input.description || ''), 60)}`;
    case 'TodoWrite':
      return 'TodoWrite';
    case 'TaskUpdate':
      return `TaskUpdate: ${truncate(String(input.status || ''), 40)}`;
    default:
      return name;
  }
}

function summarizeContent(content: unknown): string {
  if (typeof content === 'string') return truncate(content, 120);
  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'object' && block !== null && 'text' in block) {
        return truncate(String((block as { text: string }).text), 120);
      }
    }
  }
  return '';
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + '...';
}
