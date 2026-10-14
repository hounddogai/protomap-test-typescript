import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 15431.0, in order. */
export function domainRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15431) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function domainRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeDomainRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a domain rollup score falls in. */
export function classifyDomainRollup(score: number): string {
  if (score < 17.6) return "low";
  if (score < 63.1) return "minimal";
  if (score < 77.6) return "critical";
  if (score < 85.3) return "elevated";
  return "medium";
}
