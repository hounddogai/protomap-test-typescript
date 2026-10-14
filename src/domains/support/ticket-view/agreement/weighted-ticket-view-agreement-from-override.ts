import { MacroOverride } from "../../macro/override-item/macro-override.js";
import { normalizeTieredMacroSegmentCode } from "../../macro/override-item/tiered-macro-segment-policy.js";
import { WeightedTicketViewAgreement, newWeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

export function summarizeMacroOverridesForAgreement(items: MacroOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveWeightedTicketViewAgreementsFromOverride(items: MacroOverride[]): WeightedTicketViewAgreement[] {
  const out: WeightedTicketViewAgreement[] = [];
  for (const item of items) {
    const derived = newWeightedTicketViewAgreement(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateWeightedTicketViewAgreement(item: WeightedTicketViewAgreement): string {
  return normalizeTieredMacroSegmentCode(item.code);
}
