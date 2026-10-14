import * as retry from "../../../../kit/retry.js";

/** Puts a csat digest code in its canonical CD- form. */
export function normalizeCsatDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CD-")) return clean;
  return `CD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCsatDigest(): number {
  const policy = retry.defaultPolicy("csat-digest");
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
