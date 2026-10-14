import { GlobalRewardRuleSlot } from "../../reward-rule/threshold/global-reward-rule-slot.js";
import { classifyRewardRuleThreshold } from "../../reward-rule/threshold/reward-rule-threshold-policy.js";
import { StrictPayoutSegment, newStrictPayoutSegment } from "./strict-payout-segment.js";

export function summarizeGlobalRewardRuleSlotsForSegment(items: GlobalRewardRuleSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveStrictPayoutSegmentsFromSlot(items: GlobalRewardRuleSlot[]): StrictPayoutSegment[] {
  const out: StrictPayoutSegment[] = [];
  for (const item of items) {
    const derived = newStrictPayoutSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateStrictPayoutSegment(item: StrictPayoutSegment): string {
  return classifyRewardRuleThreshold(item.adjustedVolume());
}
