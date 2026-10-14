import * as numbers from "../../../../kit/numbers.js";

/** Names the band a macro slot score falls in. */
export function classifyMacroSlot(score: number): string {
  if (score < 11.3) return "medium";
  if (score < 14) return "critical";
  if (score < 66.8) return "watch";
  if (score < 76) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 16303.0, in order. */
export function macroSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16303) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function macroSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function macroSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
