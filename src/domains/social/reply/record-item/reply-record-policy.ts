import * as numbers from "../../../../kit/numbers.js";

/** Names the band a reply record score falls in. */
export function classifyReplyRecord(score: number): string {
  if (score < 47.6) return "critical";
  if (score < 82.8) return "high";
  return "low";
}

export function replyRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a reply record code in its canonical RR- form. */
export function normalizeReplyRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

export function replyRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
