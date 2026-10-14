import { ManualReputationProposal } from "../../reputation/slot/manual-reputation-proposal.js";
import { pendingReputationSlotBucket } from "../../reputation/slot/pending-reputation-slot-policy.js";
import { GlobalSenderGroup, newGlobalSenderGroup } from "./global-sender-group.js";

export function summarizeManualReputationProposalsForGroup(items: ManualReputationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveGlobalSenderGroupsFromProposal(items: ManualReputationProposal[]): GlobalSenderGroup[] {
  const out: GlobalSenderGroup[] = [];
  for (const item of items) {
    const derived = newGlobalSenderGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeGlobalSenderGroup(item: GlobalSenderGroup): string {
  return pendingReputationSlotBucket(item.projectedLoad());
}
