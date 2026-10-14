import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a batched warmup batch code in its canonical BWB- form. */
export function normalizeBatchedWarmupBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWB-")) return clean;
  return `BWB-${clean.replaceAll(" ", "-")}`;
}

export function mergeBatchedWarmupBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
