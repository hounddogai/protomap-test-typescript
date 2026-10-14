import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient reward rule reservation code in its canonical LRRR- form. */
export function normalizeLenientRewardRuleReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRRR-")) return clean;
  return `LRRR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient reward rule reservation score falls in. */
export function classifyLenientRewardRuleReservation(score: number): string {
  if (score < 39.2) return "high";
  if (score < 44.3) return "minimal";
  if (score < 58.2) return "ok";
  if (score < 83.5) return "critical";
  return "elevated";
}

export function lenientRewardRuleReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
