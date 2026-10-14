import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a primary deflection baseline score falls in. */
export function classifyPrimaryDeflectionBaseline(score: number): string {
  if (score < 17.4) return "medium";
  if (score < 23.2) return "elevated";
  if (score < 30) return "minimal";
  if (score < 54.8) return "watch";
  return "high";
}

/** Counts how many amounts fit in a budget of 76249.0, in order. */
export function primaryDeflectionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76249) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryDeflectionBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function mergePrimaryDeflectionBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
