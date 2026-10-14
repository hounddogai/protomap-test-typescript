import { normalizeGlobalDeflectionRecordCode } from "../record-item/global-deflection-record-policy.js";
import { GlobalDeflectionRecord } from "../record-item/global-deflection-record.js";
import { LegacyDeflectionSlot, newLegacyDeflectionSlot } from "./legacy-deflection-slot.js";

export function summarizeGlobalDeflectionRecordsForSlot(items: GlobalDeflectionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLegacyDeflectionSlotsFromRecord(items: GlobalDeflectionRecord[]): LegacyDeflectionSlot[] {
  const out: LegacyDeflectionSlot[] = [];
  for (const item of items) {
    const derived = newLegacyDeflectionSlot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeLegacyDeflectionSlot(item: LegacyDeflectionSlot): string {
  return normalizeGlobalDeflectionRecordCode(item.code);
}
