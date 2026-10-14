import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryExitRuleTier(): number {
  const policy = retry.defaultPolicy("primary-exit-rule-tier");
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

/** Puts a primary exit rule tier code in its canonical PERT- form. */
export function normalizePrimaryExitRuleTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PERT-")) return clean;
  return `PERT-${clean.replaceAll(" ", "-")}`;
}
