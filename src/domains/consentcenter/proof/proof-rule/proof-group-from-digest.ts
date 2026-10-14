import { classifyPendingDoubleOptInDigest } from "../../double-opt-in/slot/pending-double-opt-in-digest-policy.js";
import { PendingDoubleOptInDigest } from "../../double-opt-in/slot/pending-double-opt-in-digest.js";
import { ProofGroup, newProofGroup } from "./proof-group.js";

export function summarizePendingDoubleOptInDigestsForGroup(items: PendingDoubleOptInDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveProofGroupsFromDigest(items: PendingDoubleOptInDigest[]): ProofGroup[] {
  const out: ProofGroup[] = [];
  for (const item of items) {
    const derived = newProofGroup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeProofGroup(item: ProofGroup): string {
  return classifyPendingDoubleOptInDigest(item.weightedExposure());
}
