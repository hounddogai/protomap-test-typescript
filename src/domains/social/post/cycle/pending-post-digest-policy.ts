import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function pendingPostDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingPostDigest(): number {
  const policy = retry.defaultPolicy("pending-post-digest");
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

export function mergePendingPostDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a pending post digest code in its canonical PPD- form. */
export function normalizePendingPostDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPD-")) return clean;
  return `PPD-${clean.replaceAll(" ", "-")}`;
}
