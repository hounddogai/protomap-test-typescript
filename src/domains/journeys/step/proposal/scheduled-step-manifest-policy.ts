import * as numbers from "../../../../kit/numbers.js";

export function scheduledStepManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a scheduled step manifest score falls in. */
export function classifyScheduledStepManifest(score: number): string {
  if (score < 30) return "low";
  if (score < 41.8) return "ok";
  if (score < 42) return "medium";
  if (score < 92.8) return "elevated";
  return "high";
}

/** Puts a scheduled step manifest code in its canonical SSM- form. */
export function normalizeScheduledStepManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSM-")) return clean;
  return `SSM-${clean.replaceAll(" ", "-")}`;
}
