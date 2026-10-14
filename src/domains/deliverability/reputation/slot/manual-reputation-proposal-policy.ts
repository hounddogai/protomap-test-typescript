import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualReputationProposal(): number {
  const policy = retry.defaultPolicy("manual-reputation-proposal");
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

/** Puts a manual reputation proposal code in its canonical MRP- form. */
export function normalizeManualReputationProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRP-")) return clean;
  return `MRP-${clean.replaceAll(" ", "-")}`;
}

export function mergeManualReputationProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a manual reputation proposal score falls in. */
export function classifyManualReputationProposal(score: number): string {
  if (score < 29.3) return "elevated";
  if (score < 86) return "medium";
  return "ok";
}
