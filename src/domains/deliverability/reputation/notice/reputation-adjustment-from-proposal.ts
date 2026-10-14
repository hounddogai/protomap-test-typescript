import { AdaptiveSenderProposal } from "../../sender/sender-proposal/adaptive-sender-proposal.js";
import { senderScoreBucket } from "../../sender/sender-proposal/sender-score-policy.js";
import { ReputationAdjustment, newReputationAdjustment } from "./reputation-adjustment.js";

export function summarizeAdaptiveSenderProposalsForAdjustment(items: AdaptiveSenderProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReputationAdjustmentsFromProposal(items: AdaptiveSenderProposal[]): ReputationAdjustment[] {
  const out: ReputationAdjustment[] = [];
  for (const item of items) {
    const derived = newReputationAdjustment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateReputationAdjustment(item: ReputationAdjustment): string {
  return senderScoreBucket(item.adjustedExposure());
}
