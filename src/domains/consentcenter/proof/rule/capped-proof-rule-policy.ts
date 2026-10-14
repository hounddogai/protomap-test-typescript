import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 69469.0, in order. */
export function cappedProofRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69469) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped proof rule code in its canonical CPR- form. */
export function normalizeCappedProofRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPR-")) return clean;
  return `CPR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedProofRule(): number {
  const policy = retry.defaultPolicy("capped-proof-rule");
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
