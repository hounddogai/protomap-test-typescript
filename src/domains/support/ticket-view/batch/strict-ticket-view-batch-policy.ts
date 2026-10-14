import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictTicketViewBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 55542.0, in order. */
export function strictTicketViewBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55542) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict ticket view batch score falls in. */
export function classifyStrictTicketViewBatch(score: number): string {
  if (score < 5.8) return "ok";
  if (score < 44.9) return "low";
  if (score < 96.1) return "high";
  return "medium";
}

/** Puts a strict ticket view batch code in its canonical STVB- form. */
export function normalizeStrictTicketViewBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STVB-")) return clean;
  return `STVB-${clean.replaceAll(" ", "-")}`;
}
