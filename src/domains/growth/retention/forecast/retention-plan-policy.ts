import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a retention plan code in its canonical RP- form. */
export function normalizeRetentionPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}

export function mergeRetentionPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 26181.0, in order. */
export function retentionPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26181) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
