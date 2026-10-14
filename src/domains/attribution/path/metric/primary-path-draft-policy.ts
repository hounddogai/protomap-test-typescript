import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 29982.0, in order. */
export function primaryPathDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29982) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryPathDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary path draft code in its canonical PPD- form. */
export function normalizePrimaryPathDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPD-")) return clean;
  return `PPD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryPathDraft(): number {
  const policy = retry.defaultPolicy("primary-path-draft");
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
