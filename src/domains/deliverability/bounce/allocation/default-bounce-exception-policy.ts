import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function defaultBounceExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeDefaultBounceExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default bounce exception score falls in. */
export function classifyDefaultBounceException(score: number): string {
  if (score < 27.5) return "high";
  if (score < 95.4) return "ok";
  return "medium";
}

/** Puts a default bounce exception code in its canonical DBE- form. */
export function normalizeDefaultBounceExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DBE-")) return clean;
  return `DBE-${clean.replaceAll(" ", "-")}`;
}
