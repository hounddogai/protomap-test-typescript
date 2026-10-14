import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback journey summary code in its canonical FJS- form. */
export function normalizeFallbackJourneySummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FJS-")) return clean;
  return `FJS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 50821.0, in order. */
export function fallbackJourneySummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50821) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeFallbackJourneySummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackJourneySummary(): number {
  const policy = retry.defaultPolicy("fallback-journey-summary");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
