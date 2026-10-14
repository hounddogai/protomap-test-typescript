import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a macro override code in its canonical MO- form. */
export function normalizeMacroOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MO-")) return clean;
  return `MO-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 99585.0, in order. */
export function macroOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99585) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeMacroOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
