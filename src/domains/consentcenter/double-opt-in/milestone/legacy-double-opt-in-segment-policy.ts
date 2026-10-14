import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyDoubleOptInSegment(): number {
  const policy = retry.defaultPolicy("legacy-double-opt-in-segment");
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

/** Puts a legacy double opt in segment code in its canonical LDOIS- form. */
export function normalizeLegacyDoubleOptInSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDOIS-")) return clean;
  return `LDOIS-${clean.replaceAll(" ", "-")}`;
}
