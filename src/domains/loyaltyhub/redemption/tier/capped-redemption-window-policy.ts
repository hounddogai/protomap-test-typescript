import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a capped redemption window code in its canonical CRW- form. */
export function normalizeCappedRedemptionWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CRW-")) return clean;
  return `CRW-${clean.replaceAll(" ", "-")}`;
}

export function cappedRedemptionWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeCappedRedemptionWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped redemption window score falls in. */
export function classifyCappedRedemptionWindow(score: number): string {
  if (score < 48.8) return "critical";
  if (score < 87.7) return "high";
  if (score < 88.2) return "minimal";
  return "ok";
}
