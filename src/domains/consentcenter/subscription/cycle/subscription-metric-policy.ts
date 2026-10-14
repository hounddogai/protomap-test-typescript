import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a subscription metric code in its canonical SM- form. */
export function normalizeSubscriptionMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SM-")) return clean;
  return `SM-${clean.replaceAll(" ", "-")}`;
}

export function mergeSubscriptionMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
