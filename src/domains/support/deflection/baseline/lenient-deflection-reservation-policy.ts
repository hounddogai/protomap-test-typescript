import * as numbers from "../../../../kit/numbers.js";

export function lenientDeflectionReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientDeflectionReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
