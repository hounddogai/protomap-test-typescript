import * as retry from "../../../../kit/retry.js";

/** Puts a capped suppression record code in its canonical CSR- form. */
export function normalizeCappedSuppressionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CSR-")) return clean;
  return `CSR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedSuppressionRecord(): number {
  const policy = retry.defaultPolicy("capped-suppression-record");
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

/** Counts how many amounts fit in a budget of 18768.0, in order. */
export function cappedSuppressionRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18768) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
