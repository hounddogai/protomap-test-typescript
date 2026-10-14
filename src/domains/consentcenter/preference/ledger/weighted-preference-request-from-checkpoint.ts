import { pendingProofMappingWeight } from "../../proof/proof-checkpoint/pending-proof-mapping-policy.js";
import { StrictProofCheckpoint } from "../../proof/proof-checkpoint/strict-proof-checkpoint.js";
import { WeightedPreferenceRequest, newWeightedPreferenceRequest } from "./weighted-preference-request.js";

export function summarizeStrictProofCheckpointsForRequest(items: StrictProofCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveWeightedPreferenceRequestsFromCheckpoint(items: StrictProofCheckpoint[]): WeightedPreferenceRequest[] {
  const out: WeightedPreferenceRequest[] = [];
  for (const item of items) {
    const derived = newWeightedPreferenceRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeWeightedPreferenceRequest(item: WeightedPreferenceRequest): number {
  return pendingProofMappingWeight(9, true);
}
