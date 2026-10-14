import * as numbers from "../../../../kit/numbers.js";

export function cappedDeflectionTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 64075.0, in order. */
export function cappedDeflectionTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64075) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedDeflectionTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a capped deflection template score falls in. */
export function classifyCappedDeflectionTemplate(score: number): string {
  if (score < 12.4) return "minimal";
  if (score < 36.3) return "elevated";
  return "high";
}
