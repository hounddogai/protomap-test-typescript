import { normalizeAdaptiveBidRuleBudgetCode } from "../../bid-rule/budget/adaptive-bid-rule-budget-policy.js";
import { TieredBidRuleRollup } from "../../bid-rule/budget/tiered-bid-rule-rollup.js";
import { StrictCreativeDraft, newStrictCreativeDraft } from "./strict-creative-draft.js";

export function summarizeTieredBidRuleRollupsForDraft(items: TieredBidRuleRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStrictCreativeDraftsFromRollup(items: TieredBidRuleRollup[]): StrictCreativeDraft[] {
  const out: StrictCreativeDraft[] = [];
  for (const item of items) {
    const derived = newStrictCreativeDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreStrictCreativeDraft(item: StrictCreativeDraft): string {
  return normalizeAdaptiveBidRuleBudgetCode(item.code);
}
