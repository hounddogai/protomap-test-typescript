import * as retry from "../../../../kit/retry.js";

/** Puts a rolling conversion bundle code in its canonical RCB- form. */
export function normalizeRollingConversionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCB-")) return clean;
  return `RCB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingConversionBundle(): number {
  const policy = retry.defaultPolicy("rolling-conversion-bundle");
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
