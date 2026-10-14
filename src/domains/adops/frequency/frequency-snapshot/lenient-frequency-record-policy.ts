import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient frequency record score falls in. */
export function classifyLenientFrequencyRecord(score: number): string {
  if (score < 23.7) return "watch";
  if (score < 55.9) return "low";
  return "ok";
}

export function lenientFrequencyRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function lenientFrequencyRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 58073.0, in order. */
export function lenientFrequencyRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58073) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
