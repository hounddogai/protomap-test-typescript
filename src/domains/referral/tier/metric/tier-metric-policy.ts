import * as numbers from "../../../../kit/numbers.js";

export function tierMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tierMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a tier metric code in its canonical TM- form. */
export function normalizeTierMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TM-")) return clean;
  return `TM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a tier metric score falls in. */
export function classifyTierMetric(score: number): string {
  if (score < 21.3) return "high";
  if (score < 73.4) return "ok";
  if (score < 82.1) return "critical";
  if (score < 91) return "elevated";
  return "low";
}
