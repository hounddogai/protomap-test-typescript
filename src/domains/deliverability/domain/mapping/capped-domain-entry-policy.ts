import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function cappedDomainEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function cappedDomainEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedDomainEntry(): number {
  const policy = retry.defaultPolicy("capped-domain-entry");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 82385.0, in order. */
export function cappedDomainEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82385) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
