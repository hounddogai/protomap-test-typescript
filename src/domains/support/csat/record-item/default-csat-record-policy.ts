import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default csat record score falls in. */
export function classifyDefaultCsatRecord(score: number): string {
  if (score < 41.4) return "high";
  if (score < 52) return "watch";
  if (score < 76.2) return "minimal";
  if (score < 91.4) return "ok";
  return "elevated";
}

export function defaultCsatRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a default csat record code in its canonical DCR- form. */
export function normalizeDefaultCsatRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCR-")) return clean;
  return `DCR-${clean.replaceAll(" ", "-")}`;
}
