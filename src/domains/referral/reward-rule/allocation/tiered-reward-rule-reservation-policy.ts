import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredRewardRuleReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a tiered reward rule reservation score falls in. */
export function classifyTieredRewardRuleReservation(score: number): string {
  if (score < 6.9) return "high";
  if (score < 35.5) return "medium";
  if (score < 43.8) return "critical";
  return "ok";
}

/** Puts a tiered reward rule reservation code in its canonical TRRR- form. */
export function normalizeTieredRewardRuleReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRRR-")) return clean;
  return `TRRR-${clean.replaceAll(" ", "-")}`;
}
