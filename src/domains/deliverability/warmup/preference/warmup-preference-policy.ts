import * as retry from "../../../../kit/retry.js";

/** Puts a warmup preference code in its canonical WP- form. */
export function normalizeWarmupPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WP-")) return clean;
  return `WP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 39204.0, in order. */
export function warmupPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39204) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupPreference(): number {
  const policy = retry.defaultPolicy("warmup-preference");
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
