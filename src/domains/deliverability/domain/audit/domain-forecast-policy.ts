import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function domainForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 42895.0, in order. */
export function domainForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42895) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeDomainForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
