import * as numbers from "../../../../kit/numbers.js";

export function manualModelDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a manual model draft score falls in. */
export function classifyManualModelDraft(score: number): string {
  if (score < 7.2) return "low";
  if (score < 71.6) return "medium";
  if (score < 99.9) return "watch";
  return "critical";
}

/** Puts a manual model draft code in its canonical MMD- form. */
export function normalizeManualModelDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MMD-")) return clean;
  return `MMD-${clean.replaceAll(" ", "-")}`;
}

export function manualModelDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
