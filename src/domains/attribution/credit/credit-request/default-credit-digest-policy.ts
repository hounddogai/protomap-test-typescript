import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a default credit digest code in its canonical DCD- form. */
export function normalizeDefaultCreditDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCD-")) return clean;
  return `DCD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default credit digest score falls in. */
export function classifyDefaultCreditDigest(score: number): string {
  if (score < 3.3) return "watch";
  if (score < 21.6) return "medium";
  return "high";
}

export function mergeDefaultCreditDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
