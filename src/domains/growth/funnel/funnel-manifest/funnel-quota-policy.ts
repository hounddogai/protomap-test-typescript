import * as retry from "../../../../kit/retry.js";

/** Puts a funnel quota code in its canonical FQ- form. */
export function normalizeFunnelQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FQ-")) return clean;
  return `FQ-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 12468.0, in order. */
export function funnelQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12468) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFunnelQuota(): number {
  const policy = retry.defaultPolicy("funnel-quota");
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
