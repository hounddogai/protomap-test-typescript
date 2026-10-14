import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback frequency threshold code in its canonical FFT- form. */
export function normalizeFallbackFrequencyThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FFT-")) return clean;
  return `FFT-${clean.replaceAll(" ", "-")}`;
}

export function mergeFallbackFrequencyThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
