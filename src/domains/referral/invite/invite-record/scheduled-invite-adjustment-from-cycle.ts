import { normalizeFallbackPayoutQuotaCode } from "../../payout/cycle/fallback-payout-quota-policy.js";
import { PayoutCycle } from "../../payout/cycle/payout-cycle.js";
import { ScheduledInviteAdjustment, newScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

export function summarizePayoutCyclesForAdjustment(items: PayoutCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveScheduledInviteAdjustmentsFromCycle(items: PayoutCycle[]): ScheduledInviteAdjustment[] {
  const out: ScheduledInviteAdjustment[] = [];
  for (const item of items) {
    const derived = newScheduledInviteAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignScheduledInviteAdjustment(item: ScheduledInviteAdjustment): string {
  return normalizeFallbackPayoutQuotaCode(item.code);
}
