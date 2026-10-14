import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a double opt in template code in its canonical DOIT- form. */
export function normalizeDoubleOptInTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIT-")) return clean;
  return `DOIT-${clean.replaceAll(" ", "-")}`;
}

export function mergeDoubleOptInTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
