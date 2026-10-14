import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a scheduled funnel bundle code in its canonical SFB- form. */
export function normalizeScheduledFunnelBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFB-")) return clean;
  return `SFB-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledFunnelBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
