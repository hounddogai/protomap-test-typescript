import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeFallbackPreferenceForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 93943.0, in order. */
export function fallbackPreferenceForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93943) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback preference forecast score falls in. */
export function classifyFallbackPreferenceForecast(score: number): string {
  if (score < 16.6) return "high";
  if (score < 80.3) return "elevated";
  return "low";
}

export function fallbackPreferenceForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
