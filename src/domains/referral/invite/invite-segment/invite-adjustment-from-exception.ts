import { classifyTierException } from "../../tier/manual-tier-record/tier-exception-policy.js";
import { TierException } from "../../tier/manual-tier-record/tier-exception.js";
import { InviteAdjustment, newInviteAdjustment } from "./invite-adjustment.js";

export function summarizeTierExceptionsForAdjustment(items: TierException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveInviteAdjustmentsFromException(items: TierException[]): InviteAdjustment[] {
  const out: InviteAdjustment[] = [];
  for (const item of items) {
    const derived = newInviteAdjustment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveInviteAdjustment(item: InviteAdjustment): string {
  return classifyTierException(item.measuredValue());
}
