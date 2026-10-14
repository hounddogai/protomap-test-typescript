import { seasonalCreativeQuotaBucket } from "../agreement/seasonal-creative-quota-policy.js";
import { StrictCreativeDraft } from "../agreement/strict-creative-draft.js";
import { CreativeRule, newCreativeRule } from "./creative-rule.js";

export function summarizeStrictCreativeDraftsForRule(items: StrictCreativeDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCreativeRulesFromDraft(items: StrictCreativeDraft[]): CreativeRule[] {
  const out: CreativeRule[] = [];
  for (const item of items) {
    const derived = newCreativeRule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCreativeRule(item: CreativeRule): string {
  return seasonalCreativeQuotaBucket(item.netTotal());
}
