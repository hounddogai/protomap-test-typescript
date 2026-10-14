import { normalizePrimaryRedemptionSummaryCode } from "../../redemption/group/primary-redemption-summary-policy.js";
import { PrimaryRedemptionSummary } from "../../redemption/group/primary-redemption-summary.js";
import { CappedBadgeSlot, newCappedBadgeSlot } from "./capped-badge-slot.js";

export function summarizePrimaryRedemptionSummariesForSlot(items: PrimaryRedemptionSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedBadgeSlotsFromSummary(items: PrimaryRedemptionSummary[]): CappedBadgeSlot[] {
  const out: CappedBadgeSlot[] = [];
  for (const item of items) {
    const derived = newCappedBadgeSlot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedBadgeSlot(item: CappedBadgeSlot): string {
  return normalizePrimaryRedemptionSummaryCode(item.code);
}
