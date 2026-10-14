import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedDeflectionEntry(): number {
  const policy = retry.defaultPolicy("weighted-deflection-entry");
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

export function weightedDeflectionEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a weighted deflection entry code in its canonical WDE- form. */
export function normalizeWeightedDeflectionEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WDE-")) return clean;
  return `WDE-${clean.replaceAll(" ", "-")}`;
}
