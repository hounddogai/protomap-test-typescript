import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultModelTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a default model tier code in its canonical DMT- form. */
export function normalizeDefaultModelTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DMT-")) return clean;
  return `DMT-${clean.replaceAll(" ", "-")}`;
}
