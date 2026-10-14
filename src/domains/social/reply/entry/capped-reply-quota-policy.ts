import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped reply quota score falls in. */
export function classifyCappedReplyQuota(score: number): string {
  if (score < 26.8) return "low";
  if (score < 28.2) return "high";
  if (score < 62.5) return "ok";
  return "watch";
}

export function mergeCappedReplyQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedReplyQuota(): number {
  const policy = retry.defaultPolicy("capped-reply-quota");
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

/** Puts a capped reply quota code in its canonical CRQ- form. */
export function normalizeCappedReplyQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CRQ-")) return clean;
  return `CRQ-${clean.replaceAll(" ", "-")}`;
}
