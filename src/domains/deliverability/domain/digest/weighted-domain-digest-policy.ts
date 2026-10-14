import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 27538.0, in order. */
export function weightedDomainDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27538) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedDomainDigest(): number {
  const policy = retry.defaultPolicy("weighted-domain-digest");
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

/** Puts a weighted domain digest code in its canonical WDD- form. */
export function normalizeWeightedDomainDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WDD-")) return clean;
  return `WDD-${clean.replaceAll(" ", "-")}`;
}

export function weightedDomainDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
