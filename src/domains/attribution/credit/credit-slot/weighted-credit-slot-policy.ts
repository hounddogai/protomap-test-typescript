import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function weightedCreditSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted credit slot score falls in. */
export function classifyWeightedCreditSlot(score: number): string {
  if (score < 22.8) return "critical";
  if (score < 26.2) return "ok";
  if (score < 33.3) return "minimal";
  return "medium";
}

/** Puts a weighted credit slot code in its canonical WCS- form. */
export function normalizeWeightedCreditSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WCS-")) return clean;
  return `WCS-${clean.replaceAll(" ", "-")}`;
}

export function mergeWeightedCreditSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
