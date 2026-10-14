import * as retry from "../../../../kit/retry.js";

export function regionalPlacementProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalPlacementProfile(): number {
  const policy = retry.defaultPolicy("regional-placement-profile");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a regional placement profile score falls in. */
export function classifyRegionalPlacementProfile(score: number): string {
  if (score < 12.9) return "critical";
  if (score < 57.7) return "low";
  return "elevated";
}

/** Puts a regional placement profile code in its canonical RPP- form. */
export function normalizeRegionalPlacementProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPP-")) return clean;
  return `RPP-${clean.replaceAll(" ", "-")}`;
}
