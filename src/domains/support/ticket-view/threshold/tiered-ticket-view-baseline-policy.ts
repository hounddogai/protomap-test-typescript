import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredTicketViewBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a tiered ticket view baseline code in its canonical TTVB- form. */
export function normalizeTieredTicketViewBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TTVB-")) return clean;
  return `TTVB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 47074.0, in order. */
export function tieredTicketViewBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47074) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered ticket view baseline score falls in. */
export function classifyTieredTicketViewBaseline(score: number): string {
  if (score < 51.4) return "low";
  if (score < 79.8) return "watch";
  return "high";
}
