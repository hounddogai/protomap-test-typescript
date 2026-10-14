import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedJourneyReview(): number {
  const policy = retry.defaultPolicy("capped-journey-review");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 89161.0, in order. */
export function cappedJourneyReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89161) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped journey review code in its canonical CJR- form. */
export function normalizeCappedJourneyReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CJR-")) return clean;
  return `CJR-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedJourneyReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
