import * as numbers from "../../../../kit/numbers.js";

export function manualBadgeForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function manualBadgeForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual badge forecast code in its canonical MBF- form. */
export function normalizeManualBadgeForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MBF-")) return clean;
  return `MBF-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a manual badge forecast score falls in. */
export function classifyManualBadgeForecast(score: number): string {
  if (score < 26.5) return "critical";
  if (score < 39.1) return "ok";
  if (score < 61.5) return "elevated";
  if (score < 78.1) return "medium";
  return "minimal";
}
