import * as numbers from "../../../../kit/numbers.js";

export function rewardReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a reward reservation code in its canonical RR- form. */
export function normalizeRewardReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

export function rewardReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function rewardReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
