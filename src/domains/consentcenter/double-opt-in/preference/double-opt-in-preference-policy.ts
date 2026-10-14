import * as retry from "../../../../kit/retry.js";

/** Puts a double opt in preference code in its canonical DOIP- form. */
export function normalizeDoubleOptInPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIP-")) return clean;
  return `DOIP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDoubleOptInPreference(): number {
  const policy = retry.defaultPolicy("double-opt-in-preference");
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
