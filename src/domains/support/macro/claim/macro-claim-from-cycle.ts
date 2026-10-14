import { classifyDeflectionCycle } from "../../deflection/ledger/deflection-cycle-policy.js";
import { DeflectionCycle } from "../../deflection/ledger/deflection-cycle.js";
import { MacroClaim, newMacroClaim } from "./macro-claim.js";

export function summarizeDeflectionCyclesForClaim(items: DeflectionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveMacroClaimsFromCycle(items: DeflectionCycle[]): MacroClaim[] {
  const out: MacroClaim[] = [];
  for (const item of items) {
    const derived = newMacroClaim(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyMacroClaimExtra(item: MacroClaim): string {
  return classifyDeflectionCycle(item.measuredValue());
}
