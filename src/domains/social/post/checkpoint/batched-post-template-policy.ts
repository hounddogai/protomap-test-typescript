import * as retry from "../../../../kit/retry.js";

export function batchedPostTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a batched post template score falls in. */
export function classifyBatchedPostTemplate(score: number): string {
  if (score < 1.6) return "low";
  if (score < 26.3) return "minimal";
  return "medium";
}

/** Counts how many amounts fit in a budget of 24959.0, in order. */
export function batchedPostTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24959) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedPostTemplate(): number {
  const policy = retry.defaultPolicy("batched-post-template");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
