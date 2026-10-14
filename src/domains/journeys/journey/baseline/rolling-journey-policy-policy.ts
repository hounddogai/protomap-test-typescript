import * as retry from "../../../../kit/retry.js";

export function rollingJourneyPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a rolling journey policy code in its canonical RJP- form. */
export function normalizeRollingJourneyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RJP-")) return clean;
  return `RJP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling journey policy score falls in. */
export function classifyRollingJourneyPolicy(score: number): string {
  if (score < 34.4) return "ok";
  if (score < 93.3) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingJourneyPolicy(): number {
  const policy = retry.defaultPolicy("rolling-journey-policy");
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
