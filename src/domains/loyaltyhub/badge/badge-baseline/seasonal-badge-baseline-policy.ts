import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalBadgeBaseline(): number {
  const policy = retry.defaultPolicy("seasonal-badge-baseline");
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

/** Puts a seasonal badge baseline code in its canonical SBB- form. */
export function normalizeSeasonalBadgeBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBB-")) return clean;
  return `SBB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal badge baseline score falls in. */
export function classifySeasonalBadgeBaseline(score: number): string {
  if (score < 11.8) return "watch";
  if (score < 42.7) return "high";
  return "minimal";
}

export function seasonalBadgeBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
