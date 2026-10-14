import { classifyPrimaryMacroPolicy } from "../../macro/regional-macro-snapshot/primary-macro-policy-policy.js";
import { PrimaryMacroPolicy } from "../../macro/regional-macro-snapshot/primary-macro-policy.js";
import { WeightedTicketViewCycle, newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

export function summarizePrimaryMacroPoliciesForCycle(items: PrimaryMacroPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveWeightedTicketViewCyclesFromPolicy(items: PrimaryMacroPolicy[]): WeightedTicketViewCycle[] {
  const out: WeightedTicketViewCycle[] = [];
  for (const item of items) {
    const derived = newWeightedTicketViewCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeWeightedTicketViewCycle(item: WeightedTicketViewCycle): string {
  return classifyPrimaryMacroPolicy(item.measuredValue());
}
