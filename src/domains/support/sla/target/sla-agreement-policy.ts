import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a sla agreement code in its canonical SA- form. */
export function normalizeSlaAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}

export function mergeSlaAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function slaAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 59006.0, in order. */
export function slaAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59006) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
