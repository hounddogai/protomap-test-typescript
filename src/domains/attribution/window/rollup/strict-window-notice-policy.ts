import * as retry from "../../../../kit/retry.js";

export function strictWindowNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictWindowNotice(): number {
  const policy = retry.defaultPolicy("strict-window-notice");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a strict window notice score falls in. */
export function classifyStrictWindowNotice(score: number): string {
  if (score < 22) return "low";
  if (score < 39.7) return "critical";
  if (score < 94) return "high";
  if (score < 98.9) return "watch";
  return "medium";
}
