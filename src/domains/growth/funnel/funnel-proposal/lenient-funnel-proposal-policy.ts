import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function lenientFunnelProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeLenientFunnelProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function lenientFunnelProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 2776.0, in order. */
export function lenientFunnelProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2776) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
