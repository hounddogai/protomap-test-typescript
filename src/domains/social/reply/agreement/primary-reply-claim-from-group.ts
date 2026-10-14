import { classifyRegionalApprovalGroup } from "../../approval/group/regional-approval-group-policy.js";
import { RegionalApprovalGroup } from "../../approval/group/regional-approval-group.js";
import { PrimaryReplyClaim, newPrimaryReplyClaim } from "./primary-reply-claim.js";

export function summarizeRegionalApprovalGroupsForClaim(items: RegionalApprovalGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePrimaryReplyClaimsFromGroup(items: RegionalApprovalGroup[]): PrimaryReplyClaim[] {
  const out: PrimaryReplyClaim[] = [];
  for (const item of items) {
    const derived = newPrimaryReplyClaim(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignPrimaryReplyClaim(item: PrimaryReplyClaim): string {
  return classifyRegionalApprovalGroup(item.projectedVolume());
}
