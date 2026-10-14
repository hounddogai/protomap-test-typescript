import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a primary challenge manifest code in its canonical PCM- form. */
export function normalizePrimaryChallengeManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCM-")) return clean;
  return `PCM-${clean.replaceAll(" ", "-")}`;
}

export function primaryChallengeManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryChallengeManifest(): number {
  const policy = retry.defaultPolicy("primary-challenge-manifest");
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

/** Counts how many amounts fit in a budget of 98710.0, in order. */
export function primaryChallengeManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98710) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
