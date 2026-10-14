import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredReputationProposal(): number {
  const policy = retry.defaultPolicy("tiered-reputation-proposal");
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

export function tieredReputationProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered reputation proposal score falls in. */
export function classifyTieredReputationProposal(score: number): string {
  if (score < 20.7) return "ok";
  if (score < 100) return "elevated";
  return "high";
}

export function mergeTieredReputationProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
