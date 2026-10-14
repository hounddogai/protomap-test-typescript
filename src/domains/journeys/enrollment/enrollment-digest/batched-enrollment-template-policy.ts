import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36893.0, in order. */
export function batchedEnrollmentTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36893) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedEnrollmentTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched enrollment template score falls in. */
export function classifyBatchedEnrollmentTemplate(score: number): string {
  if (score < 29.2) return "low";
  if (score < 47.6) return "minimal";
  if (score < 74.8) return "watch";
  return "ok";
}
