import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 69528.0, in order. */
export function strictCohortTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69528) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictCohortTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a strict cohort template score falls in. */
export function classifyStrictCohortTemplate(score: number): string {
  if (score < 15.2) return "elevated";
  if (score < 65.5) return "critical";
  if (score < 88.5) return "high";
  return "ok";
}

export function strictCohortTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
