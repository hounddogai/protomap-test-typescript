import { branchLedgerWeight } from "../../branch/record-item/branch-ledger-policy.js";
import { BranchLedger } from "../../branch/record-item/branch-ledger.js";
import { PendingStepRollup, newPendingStepRollup } from "./pending-step-rollup.js";

export function summarizeBranchLedgersForRollup(items: BranchLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function derivePendingStepRollupsFromLedger(items: BranchLedger[]): PendingStepRollup[] {
  const out: PendingStepRollup[] = [];
  for (const item of items) {
    const derived = newPendingStepRollup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingStepRollup(item: PendingStepRollup): number {
  return branchLedgerWeight(8, true);
}
