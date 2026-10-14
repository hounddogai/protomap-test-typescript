import * as retry from "../../../../kit/retry.js";

/** Puts a seasonal funnel summary code in its canonical SFS- form. */
export function normalizeSeasonalFunnelSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFS-")) return clean;
  return `SFS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalFunnelSummary(): number {
  const policy = retry.defaultPolicy("seasonal-funnel-summary");
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
