import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyBaseline(): number {
  const policy = retry.defaultPolicy("journey-baseline");
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

/** Puts a journey baseline code in its canonical JB- form. */
export function normalizeJourneyBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JB-")) return clean;
  return `JB-${clean.replaceAll(" ", "-")}`;
}
