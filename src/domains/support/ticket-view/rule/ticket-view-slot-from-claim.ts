import { classifyMacroClaim } from "../../macro/claim/macro-claim-policy.js";
import { MacroClaim } from "../../macro/claim/macro-claim.js";
import { TicketViewSlot, newTicketViewSlot } from "./ticket-view-slot.js";

export function summarizeMacroClaimsForSlot(items: MacroClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTicketViewSlotsFromClaim(items: MacroClaim[]): TicketViewSlot[] {
  const out: TicketViewSlot[] = [];
  for (const item of items) {
    const derived = newTicketViewSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTicketViewSlot(item: TicketViewSlot): string {
  return classifyMacroClaim(item.measuredValue());
}
