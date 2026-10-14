import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePostManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 59941.0, in order. */
export function postManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59941) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a post manifest code in its canonical PM- form. */
export function normalizePostManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PM-")) return clean;
  return `PM-${clean.replaceAll(" ", "-")}`;
}
