import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a reputation baseline code in its canonical RB- form. */
export function normalizeReputationBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RB-")) return clean;
  return `RB-${clean.replaceAll(" ", "-")}`;
}

export function reputationBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReputationBaseline(): number {
  const policy = retry.defaultPolicy("reputation-baseline");
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

export function mergeReputationBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
