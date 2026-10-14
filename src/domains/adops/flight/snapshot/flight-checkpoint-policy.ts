import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeFlightCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function flightCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a flight checkpoint code in its canonical FC- form. */
export function normalizeFlightCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FC-")) return clean;
  return `FC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 19137.0, in order. */
export function flightCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19137) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
