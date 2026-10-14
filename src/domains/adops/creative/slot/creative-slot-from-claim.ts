import { defaultBidRuleAdjustmentBucket } from "../../bid-rule/claim/default-bid-rule-adjustment-policy.js";
import { ManualBidRuleClaim } from "../../bid-rule/claim/manual-bid-rule-claim.js";
import { CreativeSlot, newCreativeSlot } from "./creative-slot.js";

export function summarizeManualBidRuleClaimsForSlot(items: ManualBidRuleClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreativeSlotsFromClaim(items: ManualBidRuleClaim[]): CreativeSlot[] {
  const out: CreativeSlot[] = [];
  for (const item of items) {
    const derived = newCreativeSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCreativeSlot(item: CreativeSlot): string {
  return defaultBidRuleAdjustmentBucket(item.effectiveTotal());
}
