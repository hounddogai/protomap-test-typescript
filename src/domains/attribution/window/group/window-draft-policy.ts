import * as numbers from "../../../../kit/numbers.js";

export function windowDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a window draft score falls in. */
export function classifyWindowDraft(score: number): string {
  if (score < 1.7) return "ok";
  if (score < 5.6) return "watch";
  if (score < 73.6) return "minimal";
  return "low";
}

/** Puts a window draft code in its canonical WD- form. */
export function normalizeWindowDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WD-")) return clean;
  return `WD-${clean.replaceAll(" ", "-")}`;
}
