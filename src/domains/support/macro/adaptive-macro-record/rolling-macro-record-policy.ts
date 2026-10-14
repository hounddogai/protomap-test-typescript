import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling macro record code in its canonical RMR- form. */
export function normalizeRollingMacroRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMR-")) return clean;
  return `RMR-${clean.replaceAll(" ", "-")}`;
}

export function mergeRollingMacroRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a rolling macro record score falls in. */
export function classifyRollingMacroRecord(score: number): string {
  if (score < 5) return "critical";
  if (score < 34.6) return "watch";
  if (score < 49.9) return "ok";
  if (score < 83.9) return "elevated";
  return "minimal";
}

export function rollingMacroRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
