import { InviteAgreement } from "../../invite/record-item/invite-agreement.js";
import { normalizeInviteRecordCode } from "../../invite/record-item/invite-record-policy.js";
import { ScheduledPayoutNotice, newScheduledPayoutNotice } from "./scheduled-payout-notice.js";

export function summarizeInviteAgreementsForNotice(items: InviteAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledPayoutNoticesFromAgreement(items: InviteAgreement[]): ScheduledPayoutNotice[] {
  const out: ScheduledPayoutNotice[] = [];
  for (const item of items) {
    const derived = newScheduledPayoutNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveScheduledPayoutNotice(item: ScheduledPayoutNotice): string {
  return normalizeInviteRecordCode(item.code);
}
