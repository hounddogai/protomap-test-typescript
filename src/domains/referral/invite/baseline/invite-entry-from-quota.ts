import { PayoutQuota } from "../../payout/record-item/payout-quota.js";
import { normalizePrimaryPayoutRecordCode } from "../../payout/record-item/primary-payout-record-policy.js";
import { InviteEntry, newInviteEntry } from "./invite-entry.js";

export function summarizePayoutQuotasForEntry(items: PayoutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveInviteEntriesFromQuota(items: PayoutQuota[]): InviteEntry[] {
  const out: InviteEntry[] = [];
  for (const item of items) {
    const derived = newInviteEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreInviteEntry(item: InviteEntry): string {
  return normalizePrimaryPayoutRecordCode(item.code);
}
