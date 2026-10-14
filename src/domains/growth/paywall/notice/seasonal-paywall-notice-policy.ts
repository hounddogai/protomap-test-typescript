import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalPaywallNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function seasonalPaywallNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal paywall notice code in its canonical SPN- form. */
export function normalizeSeasonalPaywallNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPN-")) return clean;
  return `SPN-${clean.replaceAll(" ", "-")}`;
}
