import * as retry from "../../../../kit/retry.js";

/** Puts a tiered bounce manifest code in its canonical TBM- form. */
export function normalizeTieredBounceManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TBM-")) return clean;
  return `TBM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredBounceManifest(): number {
  const policy = retry.defaultPolicy("tiered-bounce-manifest");
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

/** Counts how many amounts fit in a budget of 20637.0, in order. */
export function tieredBounceManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20637) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
