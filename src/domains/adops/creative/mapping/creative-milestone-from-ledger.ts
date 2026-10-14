import { BidRuleLedger } from "../../bid-rule/rule-manifest/bid-rule-ledger.js";
import { classifyBidRuleVariance } from "../../bid-rule/rule-manifest/bid-rule-variance-policy.js";
import { CreativeMilestone, newCreativeMilestone } from "./creative-milestone.js";

export function summarizeBidRuleLedgersForMilestone(items: BidRuleLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreativeMilestonesFromLedger(items: BidRuleLedger[]): CreativeMilestone[] {
  const out: CreativeMilestone[] = [];
  for (const item of items) {
    const derived = newCreativeMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreCreativeMilestone(item: CreativeMilestone): string {
  return classifyBidRuleVariance(item.projectedVolume());
}
