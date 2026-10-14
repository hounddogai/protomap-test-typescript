import * as retry from "../../../../kit/retry.js";

/** Puts a paywall estimate code in its canonical PE- form. */
export function normalizePaywallEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PE-")) return clean;
  return `PE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallEstimate(): number {
  const policy = retry.defaultPolicy("paywall-estimate");
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

/** Counts how many amounts fit in a budget of 86685.0, in order. */
export function paywallEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86685) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
