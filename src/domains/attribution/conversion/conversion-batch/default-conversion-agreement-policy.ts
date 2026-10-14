import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default conversion agreement score falls in. */
export function classifyDefaultConversionAgreement(score: number): string {
  if (score < 19) return "elevated";
  if (score < 44.1) return "medium";
  if (score < 73.7) return "watch";
  if (score < 88.9) return "ok";
  return "critical";
}

export function defaultConversionAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function defaultConversionAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
