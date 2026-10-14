import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 51207.0, in order. */
export function rollingWarmupManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51207) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a rolling warmup manifest score falls in. */
export function classifyRollingWarmupManifest(score: number): string {
  if (score < 18) return "low";
  if (score < 92.5) return "watch";
  return "critical";
}

/** Puts a rolling warmup manifest code in its canonical RWM- form. */
export function normalizeRollingWarmupManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RWM-")) return clean;
  return `RWM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingWarmupManifest(): number {
  const policy = retry.defaultPolicy("rolling-warmup-manifest");
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
