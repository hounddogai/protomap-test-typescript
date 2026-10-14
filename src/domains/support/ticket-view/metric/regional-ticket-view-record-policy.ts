import * as numbers from "../../../../kit/numbers.js";

export function regionalTicketViewRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalTicketViewRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function regionalTicketViewRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
