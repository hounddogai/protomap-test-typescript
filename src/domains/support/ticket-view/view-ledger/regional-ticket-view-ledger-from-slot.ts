import {
  globalDeflectionCheckpointWeight,
} from "../../deflection/deflection-slot/global-deflection-checkpoint-policy.js";
import { ScheduledDeflectionSlot } from "../../deflection/deflection-slot/scheduled-deflection-slot.js";
import { RegionalTicketViewLedger, newRegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

export function summarizeScheduledDeflectionSlotsForLedger(items: ScheduledDeflectionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRegionalTicketViewLedgersFromSlot(items: ScheduledDeflectionSlot[]): RegionalTicketViewLedger[] {
  const out: RegionalTicketViewLedger[] = [];
  for (const item of items) {
    const derived = newRegionalTicketViewLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRegionalTicketViewLedger(item: RegionalTicketViewLedger): number {
  return globalDeflectionCheckpointWeight(4, true);
}
