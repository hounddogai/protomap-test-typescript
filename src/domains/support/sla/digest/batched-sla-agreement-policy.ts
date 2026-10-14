import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 36027.0, in order. */
export function batchedSlaAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36027) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeBatchedSlaAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedSlaAgreement(): number {
  const policy = retry.defaultPolicy("batched-sla-agreement");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a batched sla agreement code in its canonical BSA- form. */
export function normalizeBatchedSlaAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BSA-")) return clean;
  return `BSA-${clean.replaceAll(" ", "-")}`;
}
