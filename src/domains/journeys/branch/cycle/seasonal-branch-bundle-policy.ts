import * as retry from "../../../../kit/retry.js";

/** Puts a seasonal branch bundle code in its canonical SBB- form. */
export function normalizeSeasonalBranchBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBB-")) return clean;
  return `SBB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalBranchBundle(): number {
  const policy = retry.defaultPolicy("seasonal-branch-bundle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
