import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightManifest(): number {
  const policy = retry.defaultPolicy("insight-manifest");
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

/** Puts a insight manifest code in its canonical IM- form. */
export function normalizeInsightManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IM-")) return clean;
  return `IM-${clean.replaceAll(" ", "-")}`;
}

export function insightManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 65776.0, in order. */
export function insightManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65776) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
