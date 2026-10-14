import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStepProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function stepProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a step proposal code in its canonical SP- form. */
export function normalizeStepProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SP-")) return clean;
  return `SP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 89524.0, in order. */
export function stepProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89524) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
