import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryStepScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary step score score falls in. */
export function classifyPrimaryStepScore(score: number): string {
  if (score < 19.7) return "watch";
  if (score < 62.7) return "low";
  if (score < 71.1) return "critical";
  if (score < 71.8) return "high";
  return "elevated";
}

/** Puts a primary step score code in its canonical PSS- form. */
export function normalizePrimaryStepScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSS-")) return clean;
  return `PSS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 89141.0, in order. */
export function primaryStepScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89141) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
