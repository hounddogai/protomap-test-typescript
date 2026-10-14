import { manualEscalationLedgerWeight } from "../../escalation/ledger/manual-escalation-ledger-policy.js";
import { RegionalEscalationEstimate } from "../../escalation/ledger/regional-escalation-estimate.js";
import { MacroAllocation, newMacroAllocation } from "./macro-allocation.js";

export function summarizeRegionalEscalationEstimatesForAllocation(items: RegionalEscalationEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveMacroAllocationsFromEstimate(items: RegionalEscalationEstimate[]): MacroAllocation[] {
  const out: MacroAllocation[] = [];
  for (const item of items) {
    const derived = newMacroAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchMacroAllocation(item: MacroAllocation): number {
  return manualEscalationLedgerWeight(4, true);
}
