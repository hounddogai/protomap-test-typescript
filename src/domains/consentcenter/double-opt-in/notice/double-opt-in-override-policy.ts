import * as numbers from "../../../../kit/numbers.js";

export function doubleOptInOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function doubleOptInOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a double opt in override score falls in. */
export function classifyDoubleOptInOverride(score: number): string {
  if (score < 17.6) return "elevated";
  if (score < 30.1) return "ok";
  if (score < 67.3) return "medium";
  if (score < 74.1) return "minimal";
  return "watch";
}
