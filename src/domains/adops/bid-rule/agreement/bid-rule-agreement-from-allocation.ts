import { CreativeAllocation } from "../../creative/allocation/creative-allocation.js";
import { creativeBundleWeight } from "../../creative/allocation/creative-bundle-policy.js";
import { BidRuleAgreement, newBidRuleAgreement } from "./bid-rule-agreement.js";

export function summarizeCreativeAllocationsForAgreement(items: CreativeAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveBidRuleAgreementsFromAllocation(items: CreativeAllocation[]): BidRuleAgreement[] {
  const out: BidRuleAgreement[] = [];
  for (const item of items) {
    const derived = newBidRuleAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planBidRuleAgreement(item: BidRuleAgreement): number {
  return creativeBundleWeight(7, true);
}
