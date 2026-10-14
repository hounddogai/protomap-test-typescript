import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional path forecast score falls in. */
export function classifyRegionalPathForecast(score: number): string {
  if (score < 33.8) return "high";
  if (score < 61.2) return "critical";
  if (score < 61.6) return "medium";
  if (score < 67.4) return "low";
  return "ok";
}

export function regionalPathForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a regional path forecast code in its canonical RPF- form. */
export function normalizeRegionalPathForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPF-")) return clean;
  return `RPF-${clean.replaceAll(" ", "-")}`;
}
