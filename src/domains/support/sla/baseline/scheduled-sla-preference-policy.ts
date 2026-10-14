import * as numbers from "../../../../kit/numbers.js";

export function scheduledSlaPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a scheduled sla preference score falls in. */
export function classifyScheduledSlaPreference(score: number): string {
  if (score < 3.3) return "ok";
  if (score < 31.9) return "critical";
  if (score < 69.4) return "high";
  if (score < 95.4) return "minimal";
  return "elevated";
}

export function scheduledSlaPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 99644.0, in order. */
export function scheduledSlaPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99644) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
