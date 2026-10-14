import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a batched bounce slot code in its canonical BBS- form. */
export function normalizeBatchedBounceSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BBS-")) return clean;
  return `BBS-${clean.replaceAll(" ", "-")}`;
}

export function mergeBatchedBounceSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedBounceSlot(): number {
  const policy = retry.defaultPolicy("batched-bounce-slot");
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

/** Names the band a batched bounce slot score falls in. */
export function classifyBatchedBounceSlot(score: number): string {
  if (score < 10.3) return "minimal";
  if (score < 69.1) return "elevated";
  if (score < 79.6) return "medium";
  return "ok";
}
