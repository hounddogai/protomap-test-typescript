import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeApprovalDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a approval draft code in its canonical AD- form. */
export function normalizeApprovalDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AD-")) return clean;
  return `AD-${clean.replaceAll(" ", "-")}`;
}
