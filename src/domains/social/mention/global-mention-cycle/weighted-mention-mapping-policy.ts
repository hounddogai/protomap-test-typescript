import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedMentionMapping(): number {
  const policy = retry.defaultPolicy("weighted-mention-mapping");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a weighted mention mapping score falls in. */
export function classifyWeightedMentionMapping(score: number): string {
  if (score < 20.3) return "ok";
  if (score < 58.6) return "low";
  if (score < 75.7) return "watch";
  return "high";
}

/** Counts how many amounts fit in a budget of 49143.0, in order. */
export function weightedMentionMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49143) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedMentionMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
