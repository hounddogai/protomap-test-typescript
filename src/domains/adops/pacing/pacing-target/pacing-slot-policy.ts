import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 76387.0, in order. */
export function pacingSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76387) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pacing slot code in its canonical PS- form. */
export function normalizePacingSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pacing slot score falls in. */
export function classifyPacingSlot(score: number): string {
  if (score < 28.1) return "high";
  if (score < 82.4) return "medium";
  if (score < 92.6) return "low";
  return "minimal";
}

export function pacingSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
