import { FraudCheckProposal } from "../../fraud-check/proposal/fraud-check-proposal.js";
import {
  normalizeTieredFraudCheckCheckpointCode,
} from "../../fraud-check/proposal/tiered-fraud-check-checkpoint-policy.js";
import { WeightedPayoutSegment, newWeightedPayoutSegment } from "./weighted-payout-segment.js";

export function summarizeFraudCheckProposalsForSegment(items: FraudCheckProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWeightedPayoutSegmentsFromProposal(items: FraudCheckProposal[]): WeightedPayoutSegment[] {
  const out: WeightedPayoutSegment[] = [];
  for (const item of items) {
    const derived = newWeightedPayoutSegment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeWeightedPayoutSegment(item: WeightedPayoutSegment): string {
  return normalizeTieredFraudCheckCheckpointCode(item.code);
}
