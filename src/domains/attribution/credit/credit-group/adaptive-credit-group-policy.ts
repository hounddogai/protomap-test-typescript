import * as numbers from "../../../../kit/numbers.js";

/** Names the band a adaptive credit group score falls in. */
export function classifyAdaptiveCreditGroup(score: number): string {
  if (score < 10) return "critical";
  if (score < 29.8) return "medium";
  if (score < 45) return "minimal";
  return "low";
}

/** Puts a adaptive credit group code in its canonical ACG- form. */
export function normalizeAdaptiveCreditGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACG-")) return clean;
  return `ACG-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveCreditGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
