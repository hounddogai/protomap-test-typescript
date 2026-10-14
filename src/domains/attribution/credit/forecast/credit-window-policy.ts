import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 45873.0, in order. */
export function creditWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45873) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeCreditWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a credit window score falls in. */
export function classifyCreditWindow(score: number): string {
  if (score < 89.1) return "critical";
  if (score < 94.2) return "high";
  return "elevated";
}

/** Puts a credit window code in its canonical CW- form. */
export function normalizeCreditWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CW-")) return clean;
  return `CW-${clean.replaceAll(" ", "-")}`;
}
