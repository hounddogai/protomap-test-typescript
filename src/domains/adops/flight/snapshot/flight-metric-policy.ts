import * as numbers from "../../../../kit/numbers.js";

/** Names the band a flight metric score falls in. */
export function classifyFlightMetric(score: number): string {
  if (score < 56.1) return "low";
  if (score < 67.2) return "ok";
  if (score < 82.9) return "medium";
  return "watch";
}

export function flightMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a flight metric code in its canonical FM- form. */
export function normalizeFlightMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FM-")) return clean;
  return `FM-${clean.replaceAll(" ", "-")}`;
}

export function flightMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
