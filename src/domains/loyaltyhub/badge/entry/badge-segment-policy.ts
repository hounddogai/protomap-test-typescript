import * as numbers from "../../../../kit/numbers.js";

/** Puts a badge segment code in its canonical BS- form. */
export function normalizeBadgeSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BS-")) return clean;
  return `BS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a badge segment score falls in. */
export function classifyBadgeSegment(score: number): string {
  if (score < 9.9) return "critical";
  if (score < 69) return "watch";
  return "minimal";
}

export function badgeSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
