import { rollingLevelAssignmentBucket } from "../../level/milestone/rolling-level-assignment-policy.js";
import { TieredLevelReservation } from "../../level/milestone/tiered-level-reservation.js";
import { BadgeProposal, newBadgeProposal } from "./badge-proposal.js";

export function summarizeTieredLevelReservationsForProposal(items: TieredLevelReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveBadgeProposalsFromReservation(items: TieredLevelReservation[]): BadgeProposal[] {
  const out: BadgeProposal[] = [];
  for (const item of items) {
    const derived = newBadgeProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBadgeProposal(item: BadgeProposal): string {
  return rollingLevelAssignmentBucket(item.projectedVolume());
}
