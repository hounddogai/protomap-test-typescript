import { normalizeBidRuleNoticeCode } from "../../bid-rule/notice/bid-rule-notice-policy.js";
import { BidRuleSlot } from "../../bid-rule/notice/bid-rule-slot.js";
import { FrequencyPlan, newFrequencyPlan } from "./frequency-plan.js";

export function summarizeBidRuleSlotsForPlan(items: BidRuleSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveFrequencyPlansFromSlot(items: BidRuleSlot[]): FrequencyPlan[] {
  const out: FrequencyPlan[] = [];
  for (const item of items) {
    const derived = newFrequencyPlan(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectFrequencyPlan(item: FrequencyPlan): string {
  return normalizeBidRuleNoticeCode(item.code);
}
