import * as retry from "../../../../kit/retry.js";

export function tieredFunnelSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a tiered funnel slot score falls in. */
export function classifyTieredFunnelSlot(score: number): string {
  if (score < 48.6) return "ok";
  if (score < 54.1) return "critical";
  if (score < 58.9) return "elevated";
  if (score < 92) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredFunnelSlot(): number {
  const policy = retry.defaultPolicy("tiered-funnel-slot");
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
