import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function legacyDomainLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeLegacyDomainLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 60907.0, in order. */
export function legacyDomainLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60907) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyDomainLedger(): number {
  const policy = retry.defaultPolicy("legacy-domain-ledger");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
