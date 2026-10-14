import { classifyMacroAdjustment } from "../../macro/batched-macro-snapshot/macro-adjustment-policy.js";
import { PrimaryMacroSnapshot } from "../../macro/batched-macro-snapshot/primary-macro-snapshot.js";
import { ScheduledDeflectionRecord, newScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

export function summarizePrimaryMacroSnapshotsForRecord(items: PrimaryMacroSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledDeflectionRecordsFromSnapshot(items: PrimaryMacroSnapshot[]): ScheduledDeflectionRecord[] {
  const out: ScheduledDeflectionRecord[] = [];
  for (const item of items) {
    const derived = newScheduledDeflectionRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreScheduledDeflectionRecord(item: ScheduledDeflectionRecord): string {
  return classifyMacroAdjustment(item.effectiveValue());
}
