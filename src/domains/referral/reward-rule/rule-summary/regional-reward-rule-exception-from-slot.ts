import { normalizeAdaptivePayoutSlotCode } from "../../payout/reservation/adaptive-payout-slot-policy.js";
import { AdaptivePayoutSlot } from "../../payout/reservation/adaptive-payout-slot.js";
import { RegionalRewardRuleException, newRegionalRewardRuleException } from "./regional-reward-rule-exception.js";

export function summarizeAdaptivePayoutSlotsForException(items: AdaptivePayoutSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRegionalRewardRuleExceptionsFromSlot(items: AdaptivePayoutSlot[]): RegionalRewardRuleException[] {
  const out: RegionalRewardRuleException[] = [];
  for (const item of items) {
    const derived = newRegionalRewardRuleException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalRewardRuleException(item: RegionalRewardRuleException): string {
  return normalizeAdaptivePayoutSlotCode(item.code);
}
