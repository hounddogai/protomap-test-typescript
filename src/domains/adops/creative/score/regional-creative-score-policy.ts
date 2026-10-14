import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalCreativeScore(): number {
  const policy = retry.defaultPolicy("regional-creative-score");
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

export function regionalCreativeScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 23610.0, in order. */
export function regionalCreativeScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23610) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a regional creative score code in its canonical RCS- form. */
export function normalizeRegionalCreativeScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCS-")) return clean;
  return `RCS-${clean.replaceAll(" ", "-")}`;
}
