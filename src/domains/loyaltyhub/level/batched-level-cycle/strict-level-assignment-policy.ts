import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function strictLevelAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 81293.0, in order. */
export function strictLevelAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81293) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a strict level assignment code in its canonical SLA- form. */
export function normalizeStrictLevelAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLA-")) return clean;
  return `SLA-${clean.replaceAll(" ", "-")}`;
}

export function mergeStrictLevelAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
