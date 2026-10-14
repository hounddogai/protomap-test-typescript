import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tiered queue group score falls in. */
export function classifyTieredQueueGroup(score: number): string {
  if (score < 18.7) return "high";
  if (score < 49.9) return "critical";
  if (score < 98.7) return "ok";
  return "watch";
}

/** Puts a tiered queue group code in its canonical TQG- form. */
export function normalizeTieredQueueGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TQG-")) return clean;
  return `TQG-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredQueueGroup(): number {
  const policy = retry.defaultPolicy("tiered-queue-group");
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

export function mergeTieredQueueGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
