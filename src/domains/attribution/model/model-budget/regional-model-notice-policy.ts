import * as numbers from "../../../../kit/numbers.js";

export function regionalModelNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function regionalModelNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a regional model notice score falls in. */
export function classifyRegionalModelNotice(score: number): string {
  if (score < 2) return "low";
  if (score < 3.7) return "minimal";
  if (score < 73.6) return "watch";
  return "ok";
}
