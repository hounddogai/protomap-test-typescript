import { preferenceAllocationBucket } from "../../preference/assignment/preference-allocation-policy.js";
import { PreferenceTarget } from "../../preference/assignment/preference-target.js";
import { ProofCheckpoint, newProofCheckpoint } from "./proof-checkpoint.js";

export function summarizePreferenceTargetsForCheckpoint(items: PreferenceTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveProofCheckpointsFromTarget(items: PreferenceTarget[]): ProofCheckpoint[] {
  const out: ProofCheckpoint[] = [];
  for (const item of items) {
    const derived = newProofCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitProofCheckpoint(item: ProofCheckpoint): string {
  return preferenceAllocationBucket(item.adjustedVolume());
}
