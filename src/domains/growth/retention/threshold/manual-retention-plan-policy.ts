import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeManualRetentionPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a manual retention plan code in its canonical MRP- form. */
export function normalizeManualRetentionPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRP-")) return clean;
  return `MRP-${clean.replaceAll(" ", "-")}`;
}
