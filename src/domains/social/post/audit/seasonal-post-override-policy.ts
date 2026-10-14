import * as retry from "../../../../kit/retry.js";

/** Names the band a seasonal post override score falls in. */
export function classifySeasonalPostOverride(score: number): string {
  if (score < 48.3) return "elevated";
  if (score < 53.7) return "watch";
  if (score < 60.7) return "high";
  return "minimal";
}

/** Puts a seasonal post override code in its canonical SPO- form. */
export function normalizeSeasonalPostOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPO-")) return clean;
  return `SPO-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalPostOverride(): number {
  const policy = retry.defaultPolicy("seasonal-post-override");
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

export function seasonalPostOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
