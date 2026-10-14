import * as numbers from "../../../../kit/numbers.js";

export function seasonalLevelWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalLevelWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a seasonal level window code in its canonical SLW- form. */
export function normalizeSeasonalLevelWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLW-")) return clean;
  return `SLW-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal level window score falls in. */
export function classifySeasonalLevelWindow(score: number): string {
  if (score < 42.2) return "ok";
  if (score < 53) return "minimal";
  if (score < 74.9) return "low";
  return "watch";
}
