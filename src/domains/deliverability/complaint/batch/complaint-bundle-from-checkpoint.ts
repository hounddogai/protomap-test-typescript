import { SenderCheckpoint } from "../../sender/checkpoint/sender-checkpoint.js";
import { strictSenderClaimWeight } from "../../sender/checkpoint/strict-sender-claim-policy.js";
import { ComplaintBundle, newComplaintBundle } from "./complaint-bundle.js";

export function summarizeSenderCheckpointsForBundle(items: SenderCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveComplaintBundlesFromCheckpoint(items: SenderCheckpoint[]): ComplaintBundle[] {
  const out: ComplaintBundle[] = [];
  for (const item of items) {
    const derived = newComplaintBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyComplaintBundle(item: ComplaintBundle): number {
  return strictSenderClaimWeight(5, true);
}
