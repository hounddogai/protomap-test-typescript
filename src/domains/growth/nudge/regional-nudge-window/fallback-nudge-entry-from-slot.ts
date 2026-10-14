import { normalizeNudgeSlotCode } from "../nudge-batch/nudge-slot-policy.js";
import { NudgeSlot } from "../nudge-batch/nudge-slot.js";
import { FallbackNudgeEntry, newFallbackNudgeEntry } from "./fallback-nudge-entry.js";

export function summarizeNudgeSlotsForEntry(items: NudgeSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackNudgeEntriesFromSlot(items: NudgeSlot[]): FallbackNudgeEntry[] {
  const out: FallbackNudgeEntry[] = [];
  for (const item of items) {
    const derived = newFallbackNudgeEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFallbackNudgeEntry(item: FallbackNudgeEntry): string {
  return normalizeNudgeSlotCode(item.code);
}
