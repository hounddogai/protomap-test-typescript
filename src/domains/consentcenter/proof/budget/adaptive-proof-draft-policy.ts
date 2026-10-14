import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a adaptive proof draft code in its canonical APD- form. */
export function normalizeAdaptiveProofDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APD-")) return clean;
  return `APD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive proof draft score falls in. */
export function classifyAdaptiveProofDraft(score: number): string {
  if (score < 58.4) return "critical";
  if (score < 80.1) return "ok";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveProofDraft(): number {
  const policy = retry.defaultPolicy("adaptive-proof-draft");
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

export function mergeAdaptiveProofDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
