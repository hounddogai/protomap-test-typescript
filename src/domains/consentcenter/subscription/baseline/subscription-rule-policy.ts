import * as retry from "../../../../kit/retry.js";

/** Puts a subscription rule code in its canonical SR- form. */
export function normalizeSubscriptionRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionRule(): number {
  const policy = retry.defaultPolicy("subscription-rule");
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
