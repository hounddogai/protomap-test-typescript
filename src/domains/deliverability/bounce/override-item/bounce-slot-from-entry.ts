import { PendingSenderEntry } from "../../sender/exception/pending-sender-entry.js";
import { classifySenderAudit } from "../../sender/exception/sender-audit-policy.js";
import { BounceSlot, newBounceSlot } from "./bounce-slot.js";

export function summarizePendingSenderEntriesForSlot(items: PendingSenderEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBounceSlotsFromEntry(items: PendingSenderEntry[]): BounceSlot[] {
  const out: BounceSlot[] = [];
  for (const item of items) {
    const derived = newBounceSlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBounceSlot(item: BounceSlot): string {
  return classifySenderAudit(item.projectedValue());
}
