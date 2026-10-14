import * as numbers from "../../../../kit/numbers.js";

export function fraudCheckScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a fraud check score score falls in. */
export function classifyFraudCheckScore(score: number): string {
  if (score < 67.1) return "low";
  if (score < 67.1) return "medium";
  if (score < 93.6) return "watch";
  return "ok";
}

/** Puts a fraud check score code in its canonical FCS- form. */
export function normalizeFraudCheckScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCS-")) return clean;
  return `FCS-${clean.replaceAll(" ", "-")}`;
}

export function fraudCheckScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
