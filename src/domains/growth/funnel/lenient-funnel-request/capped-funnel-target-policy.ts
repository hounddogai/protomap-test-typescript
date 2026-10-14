import * as retry from "../../../../kit/retry.js";

/** Puts a capped funnel target code in its canonical CFT- form. */
export function normalizeCappedFunnelTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFT-")) return clean;
  return `CFT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedFunnelTarget(): number {
  const policy = retry.defaultPolicy("capped-funnel-target");
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
