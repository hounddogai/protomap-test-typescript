import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a csat request code in its canonical CR- form. */
export function normalizeCsatRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

export function csatRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCsatRequest(): number {
  const policy = retry.defaultPolicy("csat-request");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 52958.0, in order. */
export function csatRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52958) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
