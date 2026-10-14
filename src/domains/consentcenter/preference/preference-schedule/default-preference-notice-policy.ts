import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default preference notice score falls in. */
export function classifyDefaultPreferenceNotice(score: number): string {
  if (score < 37.8) return "low";
  if (score < 52.8) return "ok";
  return "watch";
}

export function defaultPreferenceNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function defaultPreferenceNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function defaultPreferenceNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
