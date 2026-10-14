import { normalizeRegionalBranchDraftCode } from "../../branch/branch-template/regional-branch-draft-policy.js";
import { RegionalBranchDraft } from "../../branch/branch-template/regional-branch-draft.js";
import { StrictExitRuleItem, newStrictExitRuleItem } from "./strict-exit-rule-item.js";

export function summarizeRegionalBranchDraftsForItem(items: RegionalBranchDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStrictExitRuleItemsFromDraft(items: RegionalBranchDraft[]): StrictExitRuleItem[] {
  const out: StrictExitRuleItem[] = [];
  for (const item of items) {
    const derived = newStrictExitRuleItem(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignStrictExitRuleItem(item: StrictExitRuleItem): string {
  return normalizeRegionalBranchDraftCode(item.code);
}
