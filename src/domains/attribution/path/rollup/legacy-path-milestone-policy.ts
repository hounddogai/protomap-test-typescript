import * as retry from "../../../../kit/retry.js";

export function legacyPathMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyPathMilestone(): number {
  const policy = retry.defaultPolicy("legacy-path-milestone");
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

/** Names the band a legacy path milestone score falls in. */
export function classifyLegacyPathMilestone(score: number): string {
  if (score < 33) return "ok";
  if (score < 62.4) return "high";
  if (score < 79.2) return "critical";
  if (score < 93.3) return "medium";
  return "elevated";
}

/** Puts a legacy path milestone code in its canonical LPM- form. */
export function normalizeLegacyPathMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPM-")) return clean;
  return `LPM-${clean.replaceAll(" ", "-")}`;
}
