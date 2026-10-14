import { pendingPostDigestWeight } from "../../post/cycle/pending-post-digest-policy.js";
import { PostSnapshot } from "../../post/cycle/post-snapshot.js";
import { ApprovalRollup, newApprovalRollup } from "./approval-rollup.js";

export function summarizePostSnapshotsForRollup(items: PostSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveApprovalRollupsFromSnapshot(items: PostSnapshot[]): ApprovalRollup[] {
  const out: ApprovalRollup[] = [];
  for (const item of items) {
    const derived = newApprovalRollup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchApprovalRollup(item: ApprovalRollup): number {
  return pendingPostDigestWeight(9, true);
}
