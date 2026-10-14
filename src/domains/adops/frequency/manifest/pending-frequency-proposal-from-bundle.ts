import { pacingAllocationBucket } from "../../pacing/target/pacing-allocation-policy.js";
import { PacingBundle } from "../../pacing/target/pacing-bundle.js";
import { PendingFrequencyProposal, newPendingFrequencyProposal } from "./pending-frequency-proposal.js";

export function summarizePacingBundlesForProposal(items: PacingBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePendingFrequencyProposalsFromBundle(items: PacingBundle[]): PendingFrequencyProposal[] {
  const out: PendingFrequencyProposal[] = [];
  for (const item of items) {
    const derived = newPendingFrequencyProposal(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankPendingFrequencyProposal(item: PendingFrequencyProposal): string {
  return pacingAllocationBucket(item.projectedLoad());
}
