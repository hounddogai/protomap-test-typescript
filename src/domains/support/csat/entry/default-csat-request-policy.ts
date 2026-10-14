import * as numbers from "../../../../kit/numbers.js";

export function defaultCsatRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a default csat request code in its canonical DCR- form. */
export function normalizeDefaultCsatRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCR-")) return clean;
  return `DCR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default csat request score falls in. */
export function classifyDefaultCsatRequest(score: number): string {
  if (score < 28.2) return "low";
  if (score < 39.1) return "watch";
  if (score < 77.8) return "critical";
  if (score < 86.1) return "elevated";
  return "high";
}
