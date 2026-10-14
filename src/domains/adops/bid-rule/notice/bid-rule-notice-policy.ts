import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function bidRuleNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a bid rule notice score falls in. */
export function classifyBidRuleNotice(score: number): string {
  if (score < 8.3) return "ok";
  if (score < 34.6) return "minimal";
  if (score < 79.4) return "watch";
  if (score < 97) return "high";
  return "critical";
}

export function mergeBidRuleNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a bid rule notice code in its canonical BRN- form. */
export function normalizeBidRuleNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRN-")) return clean;
  return `BRN-${clean.replaceAll(" ", "-")}`;
}
