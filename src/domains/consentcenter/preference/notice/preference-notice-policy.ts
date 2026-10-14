import * as numbers from "../../../../kit/numbers.js";

/** Names the band a preference notice score falls in. */
export function classifyPreferenceNotice(score: number): string {
  if (score < 30.9) return "medium";
  if (score < 54.3) return "minimal";
  if (score < 66.3) return "watch";
  return "low";
}

/** Puts a preference notice code in its canonical PN- form. */
export function normalizePreferenceNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PN-")) return clean;
  return `PN-${clean.replaceAll(" ", "-")}`;
}

export function preferenceNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function preferenceNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
