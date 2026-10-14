import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a bid rule exception score falls in. */
export function classifyBidRuleException(score: number): string {
  if (score < 2.4) return "high";
  if (score < 34.8) return "minimal";
  if (score < 36) return "low";
  if (score < 90.1) return "ok";
  return "elevated";
}

/** Puts a bid rule exception code in its canonical BRE- form. */
export function normalizeBidRuleExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRE-")) return clean;
  return `BRE-${clean.replaceAll(" ", "-")}`;
}

export function mergeBidRuleExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function bidRuleExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
