import * as numbers from "../../../../kit/numbers.js";

/** Names the band a scheduled exit rule notice score falls in. */
export function classifyScheduledExitRuleNotice(score: number): string {
  if (score < 3.7) return "medium";
  if (score < 84.3) return "low";
  if (score < 92.5) return "high";
  return "ok";
}

export function scheduledExitRuleNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
