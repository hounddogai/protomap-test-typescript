import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWaitEntry(): number {
  const policy = retry.defaultPolicy("wait-entry");
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

export function waitEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a wait entry code in its canonical WE- form. */
export function normalizeWaitEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WE-")) return clean;
  return `WE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 20144.0, in order. */
export function waitEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20144) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
