import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingExitRuleLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling exit rule ledger code in its canonical RERL- form. */
export function normalizeRollingExitRuleLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RERL-")) return clean;
  return `RERL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling exit rule ledger score falls in. */
export function classifyRollingExitRuleLedger(score: number): string {
  if (score < 43.5) return "ok";
  if (score < 91.2) return "critical";
  return "watch";
}

export function rollingExitRuleLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
