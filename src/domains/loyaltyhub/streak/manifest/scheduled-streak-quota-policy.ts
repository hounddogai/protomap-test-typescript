import * as numbers from "../../../../kit/numbers.js";

export function scheduledStreakQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a scheduled streak quota score falls in. */
export function classifyScheduledStreakQuota(score: number): string {
  if (score < 49.5) return "medium";
  if (score < 84.5) return "minimal";
  if (score < 87.2) return "high";
  return "low";
}

/** Puts a scheduled streak quota code in its canonical SSQ- form. */
export function normalizeScheduledStreakQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSQ-")) return clean;
  return `SSQ-${clean.replaceAll(" ", "-")}`;
}
