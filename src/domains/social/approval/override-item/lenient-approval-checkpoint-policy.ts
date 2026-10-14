import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a lenient approval checkpoint code in its canonical LAC- form. */
export function normalizeLenientApprovalCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LAC-")) return clean;
  return `LAC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient approval checkpoint score falls in. */
export function classifyLenientApprovalCheckpoint(score: number): string {
  if (score < 43.2) return "high";
  if (score < 52.8) return "critical";
  if (score < 70.9) return "ok";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientApprovalCheckpoint(): number {
  const policy = retry.defaultPolicy("lenient-approval-checkpoint");
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

export function mergeLenientApprovalCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
