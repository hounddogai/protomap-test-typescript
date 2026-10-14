import { manualCreditLedgerWeight } from "../../credit/credit-reservation/manual-credit-ledger-policy.js";
import { ManualCreditLedger } from "../../credit/credit-reservation/manual-credit-ledger.js";
import { AdaptiveWindowGroup, newAdaptiveWindowGroup } from "./adaptive-window-group.js";

export function summarizeManualCreditLedgersForGroup(items: ManualCreditLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveAdaptiveWindowGroupsFromLedger(items: ManualCreditLedger[]): AdaptiveWindowGroup[] {
  const out: AdaptiveWindowGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveWindowGroup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveWindowGroup(item: AdaptiveWindowGroup): number {
  return manualCreditLedgerWeight(1, true);
}
