import * as numbers from "../../../../kit/numbers.js";

/** Names the band a ticket view batch score falls in. */
export function classifyTicketViewBatch(score: number): string {
  if (score < 26.9) return "minimal";
  if (score < 31.6) return "ok";
  if (score < 35.5) return "elevated";
  return "medium";
}

export function ticketViewBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a ticket view batch code in its canonical TVB- form. */
export function normalizeTicketViewBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVB-")) return clean;
  return `TVB-${clean.replaceAll(" ", "-")}`;
}

export function ticketViewBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
