import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a tiered warmup tier code in its canonical TWT- form. */
export function normalizeTieredWarmupTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TWT-")) return clean;
  return `TWT-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredWarmupTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
