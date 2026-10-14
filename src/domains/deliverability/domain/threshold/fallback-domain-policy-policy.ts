import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback domain policy code in its canonical FDP- form. */
export function normalizeFallbackDomainPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FDP-")) return clean;
  return `FDP-${clean.replaceAll(" ", "-")}`;
}

export function mergeFallbackDomainPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 73618.0, in order. */
export function fallbackDomainPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73618) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
