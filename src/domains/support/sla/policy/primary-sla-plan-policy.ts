import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function primarySlaPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a primary sla plan score falls in. */
export function classifyPrimarySlaPlan(score: number): string {
  if (score < 25.5) return "medium";
  if (score < 38.3) return "low";
  if (score < 65.8) return "critical";
  return "elevated";
}

export function mergePrimarySlaPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 45742.0, in order. */
export function primarySlaPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45742) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
