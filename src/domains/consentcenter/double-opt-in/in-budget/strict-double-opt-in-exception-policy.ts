import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictDoubleOptInException(): number {
  const policy = retry.defaultPolicy("strict-double-opt-in-exception");
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

/** Puts a strict double opt in exception code in its canonical SDOIE- form. */
export function normalizeStrictDoubleOptInExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDOIE-")) return clean;
  return `SDOIE-${clean.replaceAll(" ", "-")}`;
}
