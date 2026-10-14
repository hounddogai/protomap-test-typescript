import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a insight ledger score falls in. */
export function classifyInsightLedger(score: number): string {
  if (score < 18.2) return "high";
  if (score < 34.4) return "elevated";
  if (score < 92.3) return "minimal";
  return "low";
}

/** Puts a insight ledger code in its canonical IL- form. */
export function normalizeInsightLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IL-")) return clean;
  return `IL-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightLedger(): number {
  const policy = retry.defaultPolicy("insight-ledger");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeInsightLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
