import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryPayoutManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a primary payout manifest code in its canonical PPM- form. */
export function normalizePrimaryPayoutManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPM-")) return clean;
  return `PPM-${clean.replaceAll(" ", "-")}`;
}

export function primaryPayoutManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
