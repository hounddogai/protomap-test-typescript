import {
  normalizePendingEscalationExceptionCode,
} from "../../escalation/record-item/pending-escalation-exception-policy.js";
import { TieredEscalationRecord } from "../../escalation/record-item/tiered-escalation-record.js";
import { TieredMacroSnapshot, newTieredMacroSnapshot } from "./tiered-macro-snapshot.js";

export function summarizeTieredEscalationRecordsForSnapshot(items: TieredEscalationRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveTieredMacroSnapshotsFromRecord(items: TieredEscalationRecord[]): TieredMacroSnapshot[] {
  const out: TieredMacroSnapshot[] = [];
  for (const item of items) {
    const derived = newTieredMacroSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planTieredMacroSnapshot(item: TieredMacroSnapshot): string {
  return normalizePendingEscalationExceptionCode(item.code);
}
