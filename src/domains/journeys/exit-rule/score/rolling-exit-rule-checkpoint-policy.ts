import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling exit rule checkpoint code in its canonical RERC- form. */
export function normalizeRollingExitRuleCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RERC-")) return clean;
  return `RERC-${clean.replaceAll(" ", "-")}`;
}

export function rollingExitRuleCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 50056.0, in order. */
export function rollingExitRuleCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50056) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
