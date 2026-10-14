import * as retry from "../../../../kit/retry.js";

/** Puts a tiered domain threshold code in its canonical TDT- form. */
export function normalizeTieredDomainThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TDT-")) return clean;
  return `TDT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredDomainThreshold(): number {
  const policy = retry.defaultPolicy("tiered-domain-threshold");
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

/** Counts how many amounts fit in a budget of 84537.0, in order. */
export function tieredDomainThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84537) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
