import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual exit rule milestone code in its canonical MERM- form. */
export function normalizeManualExitRuleMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MERM-")) return clean;
  return `MERM-${clean.replaceAll(" ", "-")}`;
}

export function manualExitRuleMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a manual exit rule milestone score falls in. */
export function classifyManualExitRuleMilestone(score: number): string {
  if (score < 3.6) return "low";
  if (score < 22.7) return "watch";
  if (score < 64.6) return "high";
  return "minimal";
}

export function manualExitRuleMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
