import { adaptiveActivationExceptionBucket } from "../batch/adaptive-activation-exception-policy.js";
import { ManualActivationBatch } from "../batch/manual-activation-batch.js";
import { AdaptiveActivationProposal, newAdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

export function summarizeManualActivationBatchesForProposal(items: ManualActivationBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveAdaptiveActivationProposalsFromBatch(items: ManualActivationBatch[]): AdaptiveActivationProposal[] {
  const out: AdaptiveActivationProposal[] = [];
  for (const item of items) {
    const derived = newAdaptiveActivationProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptiveActivationProposal(item: AdaptiveActivationProposal): string {
  return adaptiveActivationExceptionBucket(item.measuredValue());
}
