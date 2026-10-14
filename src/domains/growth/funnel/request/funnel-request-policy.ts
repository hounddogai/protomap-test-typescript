import * as retry from "../../../../kit/retry.js";

/** Puts a funnel request code in its canonical FR- form. */
export function normalizeFunnelRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FR-")) return clean;
  return `FR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFunnelRequest(): number {
  const policy = retry.defaultPolicy("funnel-request");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
