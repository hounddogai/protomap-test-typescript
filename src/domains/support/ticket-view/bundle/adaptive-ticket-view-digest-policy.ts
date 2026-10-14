import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveTicketViewDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a adaptive ticket view digest code in its canonical ATVD- form. */
export function normalizeAdaptiveTicketViewDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ATVD-")) return clean;
  return `ATVD-${clean.replaceAll(" ", "-")}`;
}
