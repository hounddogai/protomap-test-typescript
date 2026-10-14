import * as numbers from "../../../../kit/numbers.js";

/** Names the band a queue template score falls in. */
export function classifyQueueTemplate(score: number): string {
  if (score < 11.4) return "ok";
  if (score < 13.7) return "minimal";
  if (score < 79.6) return "critical";
  if (score < 91.1) return "watch";
  return "low";
}

/** Counts how many amounts fit in a budget of 45792.0, in order. */
export function queueTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45792) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function queueTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
