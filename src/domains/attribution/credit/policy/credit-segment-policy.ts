import * as retry from "../../../../kit/retry.js";

/** Puts a credit segment code in its canonical CS- form. */
export function normalizeCreditSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CS-")) return clean;
  return `CS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditSegment(): number {
  const policy = retry.defaultPolicy("credit-segment");
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
