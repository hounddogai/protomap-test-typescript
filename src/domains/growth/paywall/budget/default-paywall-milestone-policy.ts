import * as retry from "../../../../kit/retry.js";

/** Puts a default paywall milestone code in its canonical DPM- form. */
export function normalizeDefaultPaywallMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPM-")) return clean;
  return `DPM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default paywall milestone score falls in. */
export function classifyDefaultPaywallMilestone(score: number): string {
  if (score < 16.3) return "ok";
  if (score < 60.8) return "elevated";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultPaywallMilestone(): number {
  const policy = retry.defaultPolicy("default-paywall-milestone");
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

export function defaultPaywallMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
