import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 72861.0, in order. */
export function manualSuppressionTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72861) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual suppression template score falls in. */
export function classifyManualSuppressionTemplate(score: number): string {
  if (score < 17.5) return "medium";
  if (score < 42.1) return "high";
  if (score < 63.4) return "low";
  if (score < 84.2) return "ok";
  return "elevated";
}

export function manualSuppressionTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function manualSuppressionTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
