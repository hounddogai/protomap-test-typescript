import { normalizeWeightedWaitBaselineCode } from "../../wait/draft/weighted-wait-baseline-policy.js";
import { WeightedWaitBaseline } from "../../wait/draft/weighted-wait-baseline.js";
import { BranchLedger, newBranchLedger } from "./branch-ledger.js";

export function summarizeWeightedWaitBaselinesForLedger(items: WeightedWaitBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBranchLedgersFromBaseline(items: WeightedWaitBaseline[]): BranchLedger[] {
  const out: BranchLedger[] = [];
  for (const item of items) {
    const derived = newBranchLedger(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchBranchLedger(item: BranchLedger): string {
  return normalizeWeightedWaitBaselineCode(item.code);
}
