import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedTicketViewExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a weighted ticket view exception code in its canonical WTVE- form. */
export function normalizeWeightedTicketViewExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WTVE-")) return clean;
  return `WTVE-${clean.replaceAll(" ", "-")}`;
}
