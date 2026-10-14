import { pendingComplaintBundleBucket } from "../manifest/pending-complaint-bundle-policy.js";
import { PendingComplaintBundle } from "../manifest/pending-complaint-bundle.js";
import { LegacyComplaintProposal, newLegacyComplaintProposal } from "./legacy-complaint-proposal.js";

export function summarizePendingComplaintBundlesForProposal(items: PendingComplaintBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyComplaintProposalsFromBundle(items: PendingComplaintBundle[]): LegacyComplaintProposal[] {
  const out: LegacyComplaintProposal[] = [];
  for (const item of items) {
    const derived = newLegacyComplaintProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeLegacyComplaintProposal(item: LegacyComplaintProposal): string {
  return pendingComplaintBundleBucket(item.netVolume());
}
