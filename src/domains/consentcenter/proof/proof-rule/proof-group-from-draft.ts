import { ManualProofDraft } from "../proof-audit/manual-proof-draft.js";
import { manualProofTierBucket } from "../proof-audit/manual-proof-tier-policy.js";
import { ProofGroup, newProofGroup } from "./proof-group.js";

export function summarizeManualProofDraftsForGroup(items: ManualProofDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveProofGroupsFromDraft(items: ManualProofDraft[]): ProofGroup[] {
  const out: ProofGroup[] = [];
  for (const item of items) {
    const derived = newProofGroup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeProofGroup(item: ProofGroup): string {
  return manualProofTierBucket(item.weightedExposure());
}
