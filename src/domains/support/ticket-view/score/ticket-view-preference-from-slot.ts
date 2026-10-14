import { classifyMacroSegment } from "../../macro/segment/macro-segment-policy.js";
import { MacroSlot } from "../../macro/segment/macro-slot.js";
import { TicketViewPreference, newTicketViewPreference } from "./ticket-view-preference.js";

export function summarizeMacroSlotsForPreference(items: MacroSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTicketViewPreferencesFromSlot(items: MacroSlot[]): TicketViewPreference[] {
  const out: TicketViewPreference[] = [];
  for (const item of items) {
    const derived = newTicketViewPreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankTicketViewPreference(item: TicketViewPreference): string {
  return classifyMacroSegment(item.projectedVolume());
}
