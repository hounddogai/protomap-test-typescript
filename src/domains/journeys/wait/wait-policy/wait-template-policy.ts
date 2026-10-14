import * as numbers from "../../../../kit/numbers.js";

/** Names the band a wait template score falls in. */
export function classifyWaitTemplate(score: number): string {
  if (score < 65.6) return "high";
  if (score < 86.8) return "elevated";
  return "watch";
}

export function waitTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
