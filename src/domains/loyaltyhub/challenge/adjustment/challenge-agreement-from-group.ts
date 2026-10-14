import { BadgeGroup } from "../../badge/allocation/badge-group.js";
import { strictBadgeAllocationBucket } from "../../badge/allocation/strict-badge-allocation-policy.js";
import { ChallengeAgreement, newChallengeAgreement } from "./challenge-agreement.js";

export function summarizeBadgeGroupsForAgreement(items: BadgeGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveChallengeAgreementsFromGroup(items: BadgeGroup[]): ChallengeAgreement[] {
  const out: ChallengeAgreement[] = [];
  for (const item of items) {
    const derived = newChallengeAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileChallengeAgreement(item: ChallengeAgreement): string {
  return strictBadgeAllocationBucket(item.adjustedTotal());
}
