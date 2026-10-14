import * as numbers from "../../../../kit/numbers.js";

export function fallbackEnrollmentNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a fallback enrollment notice score falls in. */
export function classifyFallbackEnrollmentNotice(score: number): string {
  if (score < 59.5) return "minimal";
  if (score < 91.6) return "high";
  return "ok";
}

export function fallbackEnrollmentNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function fallbackEnrollmentNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
