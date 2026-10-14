import { creativeEntryWeight } from "../../creative/entry/creative-entry-policy.js";
import { CreativeSchedule } from "../../creative/entry/creative-schedule.js";
import { BidRuleAllocation, newBidRuleAllocation } from "./bid-rule-allocation.js";

export function summarizeCreativeSchedulesForAllocation(items: CreativeSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBidRuleAllocationsFromSchedule(items: CreativeSchedule[]): BidRuleAllocation[] {
  const out: BidRuleAllocation[] = [];
  for (const item of items) {
    const derived = newBidRuleAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateBidRuleAllocation(item: BidRuleAllocation): number {
  return creativeEntryWeight(7, true);
}
