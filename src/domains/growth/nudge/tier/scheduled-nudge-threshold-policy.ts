import * as numbers from "../../../../kit/numbers.js";

export function scheduledNudgeThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function scheduledNudgeThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a scheduled nudge threshold score falls in. */
export function classifyScheduledNudgeThreshold(score: number): string {
  if (score < 18.6) return "critical";
  if (score < 22.9) return "high";
  if (score < 40.8) return "elevated";
  if (score < 45.1) return "minimal";
  return "ok";
}

/** Puts a scheduled nudge threshold code in its canonical SNT- form. */
export function normalizeScheduledNudgeThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SNT-")) return clean;
  return `SNT-${clean.replaceAll(" ", "-")}`;
}
