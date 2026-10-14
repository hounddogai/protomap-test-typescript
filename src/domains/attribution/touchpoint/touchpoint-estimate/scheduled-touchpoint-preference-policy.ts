import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 17104.0, in order. */
export function scheduledTouchpointPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17104) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledTouchpointPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function scheduledTouchpointPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function scheduledTouchpointPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
