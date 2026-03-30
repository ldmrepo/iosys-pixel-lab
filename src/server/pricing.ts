/**
 * Model pricing table and cost computation for Claude models.
 * Prices are in USD per 1 million tokens.
 */

interface ModelPrice {
  inputPer1M: number;
  outputPer1M: number;
  cacheReadPer1M: number;
  cacheWritePer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPrice> = {
  // Claude 4 generation
  'claude-sonnet-4-20250514': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    cacheReadPer1M: 0.30,
    cacheWritePer1M: 3.75,
  },
  'claude-opus-4-20250514': {
    inputPer1M: 15.00,
    outputPer1M: 75.00,
    cacheReadPer1M: 1.50,
    cacheWritePer1M: 18.75,
  },
  'claude-haiku-4-20250506': {
    inputPer1M: 0.80,
    outputPer1M: 4.00,
    cacheReadPer1M: 0.08,
    cacheWritePer1M: 1.00,
  },
  // Aliases (short model names used in some JSONL entries)
  'claude-sonnet-4-6': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    cacheReadPer1M: 0.30,
    cacheWritePer1M: 3.75,
  },
  'claude-opus-4-6': {
    inputPer1M: 15.00,
    outputPer1M: 75.00,
    cacheReadPer1M: 1.50,
    cacheWritePer1M: 18.75,
  },
  // Legacy Claude 3.5 generation
  'claude-3-5-sonnet-20241022': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    cacheReadPer1M: 0.30,
    cacheWritePer1M: 3.75,
  },
  'claude-3-5-haiku-20241022': {
    inputPer1M: 0.80,
    outputPer1M: 4.00,
    cacheReadPer1M: 0.08,
    cacheWritePer1M: 1.00,
  },
};

/**
 * Fallback pricing for unknown models — use Claude Sonnet as a reasonable default.
 */
const DEFAULT_PRICING: ModelPrice = MODEL_PRICING['claude-sonnet-4-20250514'];

/**
 * Compute the USD cost for a single turn's token usage.
 *
 * @param usage  Token counts from the JSONL turn_duration entry
 * @param model  Optional model string for pricing lookup
 * @returns      Cost in USD
 */
export function computeCost(
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  },
  model?: string,
): number {
  const pricing = (model && MODEL_PRICING[model]) ? MODEL_PRICING[model] : DEFAULT_PRICING;

  const inputCost   = usage.input_tokens * pricing.inputPer1M;
  const outputCost  = usage.output_tokens * pricing.outputPer1M;
  const cacheRead   = (usage.cache_read_input_tokens ?? 0) * pricing.cacheReadPer1M;
  const cacheWrite  = (usage.cache_creation_input_tokens ?? 0) * pricing.cacheWritePer1M;

  return (inputCost + outputCost + cacheRead + cacheWrite) / 1_000_000;
}
