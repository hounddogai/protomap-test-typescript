import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function queueAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function mergeQueueAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a queue agreement code in its canonical QA- form. */
export function normalizeQueueAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QA-")) return clean;
  return `QA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 10347.0, in order. */
export function queueAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10347) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
