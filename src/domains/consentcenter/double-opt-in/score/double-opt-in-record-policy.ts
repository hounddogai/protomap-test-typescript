import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a double opt in record score falls in. */
export function classifyDoubleOptInRecord(score: number): string {
  if (score < 23.9) return "elevated";
  if (score < 91) return "medium";
  return "ok";
}

export function doubleOptInRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a double opt in record code in its canonical DOIR- form. */
export function normalizeDoubleOptInRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIR-")) return clean;
  return `DOIR-${clean.replaceAll(" ", "-")}`;
}

export function mergeDoubleOptInRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
