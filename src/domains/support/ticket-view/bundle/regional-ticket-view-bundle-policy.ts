import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRegionalTicketViewBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalTicketViewBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a regional ticket view bundle score falls in. */
export function classifyRegionalTicketViewBundle(score: number): string {
  if (score < 11.7) return "medium";
  if (score < 50.9) return "high";
  if (score < 61.4) return "ok";
  return "critical";
}

/** Puts a regional ticket view bundle code in its canonical RTVB- form. */
export function normalizeRegionalTicketViewBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RTVB-")) return clean;
  return `RTVB-${clean.replaceAll(" ", "-")}`;
}
