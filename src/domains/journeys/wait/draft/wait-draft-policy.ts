import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function waitDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function waitDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a wait draft score falls in. */
export function classifyWaitDraft(score: number): string {
  if (score < 42.7) return "medium";
  if (score < 48.4) return "watch";
  if (score < 65.7) return "elevated";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWaitDraft(): number {
  const policy = retry.defaultPolicy("wait-draft");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
