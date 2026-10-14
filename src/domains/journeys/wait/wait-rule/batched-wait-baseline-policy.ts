import * as numbers from "../../../../kit/numbers.js";

export function batchedWaitBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a batched wait baseline score falls in. */
export function classifyBatchedWaitBaseline(score: number): string {
  if (score < 19.8) return "elevated";
  if (score < 33.9) return "minimal";
  if (score < 53.4) return "ok";
  if (score < 72.9) return "watch";
  return "low";
}

export function batchedWaitBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a batched wait baseline code in its canonical BWB- form. */
export function normalizeBatchedWaitBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWB-")) return clean;
  return `BWB-${clean.replaceAll(" ", "-")}`;
}
