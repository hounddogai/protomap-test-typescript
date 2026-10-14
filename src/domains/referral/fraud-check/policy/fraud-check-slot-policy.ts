import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fraud check slot score falls in. */
export function classifyFraudCheckSlot(score: number): string {
  if (score < 94.9) return "high";
  if (score < 95.6) return "watch";
  return "elevated";
}

export function fraudCheckSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a fraud check slot code in its canonical FCS- form. */
export function normalizeFraudCheckSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCS-")) return clean;
  return `FCS-${clean.replaceAll(" ", "-")}`;
}

export function fraudCheckSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
