import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a regional model checkpoint code in its canonical RMC- form. */
export function normalizeRegionalModelCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMC-")) return clean;
  return `RMC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 30870.0, in order. */
export function regionalModelCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30870) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeRegionalModelCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalModelCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
