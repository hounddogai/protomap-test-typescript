import { normalizeEscalationRecordCode } from "../../escalation/slot/escalation-record-policy.js";
import { EscalationSlot } from "../../escalation/slot/escalation-slot.js";
import { TicketViewAdjustment, newTicketViewAdjustment } from "./ticket-view-adjustment.js";

export function summarizeEscalationSlotsForAdjustment(items: EscalationSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveTicketViewAdjustmentsFromSlot(items: EscalationSlot[]): TicketViewAdjustment[] {
  const out: TicketViewAdjustment[] = [];
  for (const item of items) {
    const derived = newTicketViewAdjustment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTicketViewAdjustment(item: TicketViewAdjustment): string {
  return normalizeEscalationRecordCode(item.code);
}
