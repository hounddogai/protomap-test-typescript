import { classifyDefaultTouchpointRecord } from "../../touchpoint/request/default-touchpoint-record-policy.js";
import { DefaultTouchpointRecord } from "../../touchpoint/request/default-touchpoint-record.js";
import { WindowAudit, newWindowAudit } from "./window-audit.js";

export function summarizeDefaultTouchpointRecordsForAudit(items: DefaultTouchpointRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWindowAuditsFromRecord(items: DefaultTouchpointRecord[]): WindowAudit[] {
  const out: WindowAudit[] = [];
  for (const item of items) {
    const derived = newWindowAudit(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankWindowAudit(item: WindowAudit): string {
  return classifyDefaultTouchpointRecord(item.projectedTotal());
}
