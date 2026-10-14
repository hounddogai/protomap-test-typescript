import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function funnelDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function funnelDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFunnelDraft(): number {
  const policy = retry.defaultPolicy("funnel-draft");
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

/** Names the band a funnel draft score falls in. */
export function classifyFunnelDraft(score: number): string {
  if (score < 26) return "low";
  if (score < 55.9) return "ok";
  if (score < 81.1) return "medium";
  if (score < 97.3) return "watch";
  return "critical";
}
