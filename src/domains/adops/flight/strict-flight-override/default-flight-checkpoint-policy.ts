import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultFlightCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 99180.0, in order. */
export function defaultFlightCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99180) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function defaultFlightCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultFlightCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
