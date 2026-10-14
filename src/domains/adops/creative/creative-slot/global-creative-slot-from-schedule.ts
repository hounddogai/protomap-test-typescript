import { classifyRegionalBidRuleLedger } from "../../bid-rule/ledger/regional-bid-rule-ledger-policy.js";
import { SeasonalBidRuleSchedule } from "../../bid-rule/ledger/seasonal-bid-rule-schedule.js";
import { GlobalCreativeSlot, newGlobalCreativeSlot } from "./global-creative-slot.js";

export function summarizeSeasonalBidRuleSchedulesForSlot(items: SeasonalBidRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveGlobalCreativeSlotsFromSchedule(items: SeasonalBidRuleSchedule[]): GlobalCreativeSlot[] {
  const out: GlobalCreativeSlot[] = [];
  for (const item of items) {
    const derived = newGlobalCreativeSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalCreativeSlot(item: GlobalCreativeSlot): string {
  return classifyRegionalBidRuleLedger(item.weightedVolume());
}
