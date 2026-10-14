import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a primary journey audit code in its canonical PJA- form. */
export function normalizePrimaryJourneyAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PJA-")) return clean;
  return `PJA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary journey audit score falls in. */
export function classifyPrimaryJourneyAudit(score: number): string {
  if (score < 1.9) return "watch";
  if (score < 48.2) return "critical";
  return "low";
}

export function primaryJourneyAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergePrimaryJourneyAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
