import * as numbers from "../../../../kit/numbers.js";

export function batchedDomainTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function batchedDomainTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a batched domain template score falls in. */
export function classifyBatchedDomainTemplate(score: number): string {
  if (score < 16.7) return "critical";
  if (score < 36.7) return "watch";
  if (score < 71.6) return "minimal";
  if (score < 89.2) return "ok";
  return "elevated";
}
