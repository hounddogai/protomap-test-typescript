import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePathManifest(): number {
  const policy = retry.defaultPolicy("path-manifest");
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

/** Names the band a path manifest score falls in. */
export function classifyPathManifest(score: number): string {
  if (score < 19.3) return "critical";
  if (score < 30.7) return "minimal";
  if (score < 33.9) return "high";
  if (score < 65.2) return "elevated";
  return "low";
}

/** Puts a path manifest code in its canonical PM- form. */
export function normalizePathManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PM-")) return clean;
  return `PM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 3606.0, in order. */
export function pathManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3606) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
