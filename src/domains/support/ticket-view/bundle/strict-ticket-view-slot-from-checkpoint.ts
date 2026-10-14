import { escalationCheckpointBucket } from "../../escalation/batch/escalation-checkpoint-policy.js";
import { EscalationCheckpoint } from "../../escalation/batch/escalation-checkpoint.js";
import { StrictTicketViewSlot, newStrictTicketViewSlot } from "./strict-ticket-view-slot.js";

export function summarizeEscalationCheckpointsForSlot(items: EscalationCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStrictTicketViewSlotsFromCheckpoint(items: EscalationCheckpoint[]): StrictTicketViewSlot[] {
  const out: StrictTicketViewSlot[] = [];
  for (const item of items) {
    const derived = newStrictTicketViewSlot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveStrictTicketViewSlot(item: StrictTicketViewSlot): string {
  return escalationCheckpointBucket(item.netValue());
}
