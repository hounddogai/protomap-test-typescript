import * as numbers from "../../../../kit/numbers.js";

export function globalSuppressionCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalSuppressionCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a global suppression checkpoint score falls in. */
export function classifyGlobalSuppressionCheckpoint(score: number): string {
  if (score < 11.2) return "medium";
  if (score < 69.6) return "high";
  if (score < 80.9) return "ok";
  if (score < 91.8) return "critical";
  return "elevated";
}

/** Puts a global suppression checkpoint code in its canonical GSC- form. */
export function normalizeGlobalSuppressionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSC-")) return clean;
  return `GSC-${clean.replaceAll(" ", "-")}`;
}
