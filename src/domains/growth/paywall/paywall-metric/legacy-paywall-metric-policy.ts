import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy paywall metric score falls in. */
export function classifyLegacyPaywallMetric(score: number): string {
  if (score < 54) return "critical";
  if (score < 91.5) return "ok";
  return "watch";
}

/** Puts a legacy paywall metric code in its canonical LPM- form. */
export function normalizeLegacyPaywallMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPM-")) return clean;
  return `LPM-${clean.replaceAll(" ", "-")}`;
}

export function legacyPaywallMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function legacyPaywallMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
