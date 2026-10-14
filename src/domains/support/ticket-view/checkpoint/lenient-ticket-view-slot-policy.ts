import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient ticket view slot score falls in. */
export function classifyLenientTicketViewSlot(score: number): string {
  if (score < 21.5) return "elevated";
  if (score < 35.2) return "critical";
  if (score < 36.9) return "ok";
  if (score < 90.9) return "low";
  return "watch";
}

export function lenientTicketViewSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function lenientTicketViewSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
