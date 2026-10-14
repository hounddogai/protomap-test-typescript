import { LenientLevelProposal } from "../../level/quota/lenient-level-proposal.js";
import { normalizeLevelQuotaCode } from "../../level/quota/level-quota-policy.js";
import { BatchedChallengeProposal, newBatchedChallengeProposal } from "./batched-challenge-proposal.js";

export function summarizeLenientLevelProposalsForProposal(items: LenientLevelProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBatchedChallengeProposalsFromProposal(items: LenientLevelProposal[]): BatchedChallengeProposal[] {
  const out: BatchedChallengeProposal[] = [];
  for (const item of items) {
    const derived = newBatchedChallengeProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedChallengeProposal(item: BatchedChallengeProposal): string {
  return normalizeLevelQuotaCode(item.code);
}
