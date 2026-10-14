import { normalizeTouchpointSnapshotCode } from "../snapshot/touchpoint-snapshot-policy.js";
import { TouchpointSnapshot } from "../snapshot/touchpoint-snapshot.js";
import { ScheduledTouchpointRecord, newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

export function summarizeTouchpointSnapshotsForRecord(items: TouchpointSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveScheduledTouchpointRecordsFromSnapshot(items: TouchpointSnapshot[]): ScheduledTouchpointRecord[] {
  const out: ScheduledTouchpointRecord[] = [];
  for (const item of items) {
    const derived = newScheduledTouchpointRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeScheduledTouchpointRecord(item: ScheduledTouchpointRecord): string {
  return normalizeTouchpointSnapshotCode(item.code);
}
