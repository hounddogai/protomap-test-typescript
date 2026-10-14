import { branchAllocationWeight } from "../../branch/template/branch-allocation-policy.js";
import { FallbackBranchReview } from "../../branch/template/fallback-branch-review.js";
import { LegacyExitRuleLedger, newLegacyExitRuleLedger } from "./legacy-exit-rule-ledger.js";

export function summarizeFallbackBranchReviewsForLedger(items: FallbackBranchReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLegacyExitRuleLedgersFromReview(items: FallbackBranchReview[]): LegacyExitRuleLedger[] {
  const out: LegacyExitRuleLedger[] = [];
  for (const item of items) {
    const derived = newLegacyExitRuleLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyExitRuleLedger(item: LegacyExitRuleLedger): number {
  return branchAllocationWeight(5, true);
}
