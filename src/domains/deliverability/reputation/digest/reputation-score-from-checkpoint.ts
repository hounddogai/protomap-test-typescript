import { complaintAgreementBucket } from "../../complaint/reservation/complaint-agreement-policy.js";
import { ComplaintCheckpoint } from "../../complaint/reservation/complaint-checkpoint.js";
import { ReputationScore, newReputationScore } from "./reputation-score.js";

export function summarizeComplaintCheckpointsForScore(items: ComplaintCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveReputationScoresFromCheckpoint(items: ComplaintCheckpoint[]): ReputationScore[] {
  const out: ReputationScore[] = [];
  for (const item of items) {
    const derived = newReputationScore(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveReputationScore(item: ReputationScore): string {
  return complaintAgreementBucket(item.netValue());
}
