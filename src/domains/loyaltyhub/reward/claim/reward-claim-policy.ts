import * as numbers from "../../../../kit/numbers.js";

export function rewardClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function rewardClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a reward claim code in its canonical RC- form. */
export function normalizeRewardClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RC-")) return clean;
  return `RC-${clean.replaceAll(" ", "-")}`;
}
