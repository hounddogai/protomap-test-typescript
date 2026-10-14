import { InvitePolicy } from "../../invite/segment/invite-policy.js";
import { normalizeInviteProfileCode } from "../../invite/segment/invite-profile-policy.js";
import { TierRecord, newTierRecord } from "./tier-record.js";

export function summarizeInvitePoliciesForRecord(items: InvitePolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveTierRecordsFromPolicy(items: InvitePolicy[]): TierRecord[] {
  const out: TierRecord[] = [];
  for (const item of items) {
    const derived = newTierRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTierRecord(item: TierRecord): string {
  return normalizeInviteProfileCode(item.code);
}
