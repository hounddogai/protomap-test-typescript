import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a capped preference entry code in its canonical CPE- form. */
export function normalizeCappedPreferenceEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPE-")) return clean;
  return `CPE-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedPreferenceEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
