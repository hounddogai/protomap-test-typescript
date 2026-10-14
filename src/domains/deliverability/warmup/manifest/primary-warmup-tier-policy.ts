import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryWarmupTier(): number {
  const policy = retry.defaultPolicy("primary-warmup-tier");
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

/** Puts a primary warmup tier code in its canonical PWT- form. */
export function normalizePrimaryWarmupTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PWT-")) return clean;
  return `PWT-${clean.replaceAll(" ", "-")}`;
}
