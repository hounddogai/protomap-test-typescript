import { InviteGroup } from "../../invite/group/invite-group.js";
import { inviteMilestoneBucket } from "../../invite/group/invite-milestone-policy.js";
import { CappedTierRecord, newCappedTierRecord } from "./capped-tier-record.js";

export function summarizeInviteGroupsForRecord(items: InviteGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedTierRecordsFromGroup(items: InviteGroup[]): CappedTierRecord[] {
  const out: CappedTierRecord[] = [];
  for (const item of items) {
    const derived = newCappedTierRecord(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCappedTierRecord(item: CappedTierRecord): string {
  return inviteMilestoneBucket(item.projectedLoad());
}
