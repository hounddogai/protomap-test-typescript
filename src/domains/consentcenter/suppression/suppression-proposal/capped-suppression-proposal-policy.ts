import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function cappedSuppressionProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 30149.0, in order. */
export function cappedSuppressionProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30149) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedSuppressionProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedSuppressionProposal(): number {
  const policy = retry.defaultPolicy("capped-suppression-proposal");
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
