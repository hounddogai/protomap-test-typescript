import * as numbers from "../../../../kit/numbers.js";

export function seasonalLeaderboardLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function seasonalLeaderboardLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalLeaderboardLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
