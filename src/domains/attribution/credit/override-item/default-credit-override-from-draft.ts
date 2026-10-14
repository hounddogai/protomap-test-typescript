import { classifyCreditAllocation } from "../audit/credit-allocation-policy.js";
import { CreditDraft } from "../audit/credit-draft.js";
import { DefaultCreditOverride, newDefaultCreditOverride } from "./default-credit-override.js";

export function summarizeCreditDraftsForOverride(items: CreditDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveDefaultCreditOverridesFromDraft(items: CreditDraft[]): DefaultCreditOverride[] {
  const out: DefaultCreditOverride[] = [];
  for (const item of items) {
    const derived = newDefaultCreditOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceDefaultCreditOverride(item: DefaultCreditOverride): string {
  return classifyCreditAllocation(item.projectedExposure());
}
