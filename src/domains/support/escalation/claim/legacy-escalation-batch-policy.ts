import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyEscalationBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a legacy escalation batch code in its canonical LEB- form. */
export function normalizeLegacyEscalationBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LEB-")) return clean;
  return `LEB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy escalation batch score falls in. */
export function classifyLegacyEscalationBatch(score: number): string {
  if (score < 29.8) return "watch";
  if (score < 74.2) return "ok";
  return "low";
}

export function legacyEscalationBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
