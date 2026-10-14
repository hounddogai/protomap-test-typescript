import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a strict level target code in its canonical SLT- form. */
export function normalizeStrictLevelTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLT-")) return clean;
  return `SLT-${clean.replaceAll(" ", "-")}`;
}

export function strictLevelTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictLevelTarget(): number {
  const policy = retry.defaultPolicy("strict-level-target");
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

/** Counts how many amounts fit in a budget of 3914.0, in order. */
export function strictLevelTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3914) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
