import * as retry from "../../../../kit/retry.js";

/** Names the band a paywall milestone score falls in. */
export function classifyPaywallMilestone(score: number): string {
  if (score < 36.3) return "elevated";
  if (score < 61.5) return "low";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallMilestone(): number {
  const policy = retry.defaultPolicy("paywall-milestone");
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

/** Puts a paywall milestone code in its canonical PM- form. */
export function normalizePaywallMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PM-")) return clean;
  return `PM-${clean.replaceAll(" ", "-")}`;
}

export function paywallMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
