import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeProofThreshold(): number {
  const policy = retry.defaultPolicy("proof-threshold");
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

/** Puts a proof threshold code in its canonical PT- form. */
export function normalizeProofThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PT-")) return clean;
  return `PT-${clean.replaceAll(" ", "-")}`;
}
