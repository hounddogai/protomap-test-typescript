import * as numbers from "../../../../kit/numbers.js";

/** Names the band a double opt in request score falls in. */
export function classifyDoubleOptInRequest(score: number): string {
  if (score < 37.3) return "medium";
  if (score < 54.5) return "elevated";
  if (score < 74.3) return "high";
  return "critical";
}

/** Puts a double opt in request code in its canonical DOIR- form. */
export function normalizeDoubleOptInRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIR-")) return clean;
  return `DOIR-${clean.replaceAll(" ", "-")}`;
}

export function doubleOptInRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
