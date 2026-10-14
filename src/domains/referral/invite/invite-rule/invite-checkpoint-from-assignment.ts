import { LegacyPayoutAssignment } from "../../payout/review/legacy-payout-assignment.js";
import { payoutReviewWeight } from "../../payout/review/payout-review-policy.js";
import { InviteCheckpoint, newInviteCheckpoint } from "./invite-checkpoint.js";

export function summarizeLegacyPayoutAssignmentsForCheckpoint(items: LegacyPayoutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveInviteCheckpointsFromAssignment(items: LegacyPayoutAssignment[]): InviteCheckpoint[] {
  const out: InviteCheckpoint[] = [];
  for (const item of items) {
    const derived = newInviteCheckpoint(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveInviteCheckpoint(item: InviteCheckpoint): number {
  return payoutReviewWeight(5, true);
}
