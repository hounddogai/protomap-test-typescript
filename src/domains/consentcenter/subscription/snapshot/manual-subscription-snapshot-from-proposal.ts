import { SuppressionProposal } from "../../suppression/proposal/suppression-proposal.js";
import { normalizeSuppressionRecordCode } from "../../suppression/proposal/suppression-record-policy.js";
import { ManualSubscriptionSnapshot, newManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

export function summarizeSuppressionProposalsForSnapshot(items: SuppressionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualSubscriptionSnapshotsFromProposal(items: SuppressionProposal[]): ManualSubscriptionSnapshot[] {
  const out: ManualSubscriptionSnapshot[] = [];
  for (const item of items) {
    const derived = newManualSubscriptionSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankManualSubscriptionSnapshot(item: ManualSubscriptionSnapshot): string {
  return normalizeSuppressionRecordCode(item.code);
}
