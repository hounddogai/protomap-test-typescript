import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredWaitManifest(): number {
  const policy = retry.defaultPolicy("tiered-wait-manifest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function tieredWaitManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Puts a tiered wait manifest code in its canonical TWM- form. */
export function normalizeTieredWaitManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TWM-")) return clean;
  return `TWM-${clean.replaceAll(" ", "-")}`;
}
