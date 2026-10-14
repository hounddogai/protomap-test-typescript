import { classifyLenientTicketViewSlot } from "../../ticket-view/checkpoint/lenient-ticket-view-slot-policy.js";
import { LenientTicketViewSlot } from "../../ticket-view/checkpoint/lenient-ticket-view-slot.js";
import { TieredMacroPolicy, newTieredMacroPolicy } from "./tiered-macro-policy.js";

export function summarizeLenientTicketViewSlotsForPolicy(items: LenientTicketViewSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveTieredMacroPoliciesFromSlot(items: LenientTicketViewSlot[]): TieredMacroPolicy[] {
  const out: TieredMacroPolicy[] = [];
  for (const item of items) {
    const derived = newTieredMacroPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTieredMacroPolicy(item: TieredMacroPolicy): string {
  return classifyLenientTicketViewSlot(item.projectedExposure());
}
