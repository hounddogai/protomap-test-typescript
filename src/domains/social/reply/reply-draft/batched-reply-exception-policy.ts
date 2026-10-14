import * as numbers from "../../../../kit/numbers.js";

/** Names the band a batched reply exception score falls in. */
export function classifyBatchedReplyException(score: number): string {
  if (score < 21.3) return "medium";
  if (score < 26.7) return "minimal";
  if (score < 62.9) return "ok";
  return "low";
}

export function batchedReplyExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a batched reply exception code in its canonical BRE- form. */
export function normalizeBatchedReplyExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRE-")) return clean;
  return `BRE-${clean.replaceAll(" ", "-")}`;
}
