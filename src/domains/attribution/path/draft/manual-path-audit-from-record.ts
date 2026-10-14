import { normalizePathOverrideCode } from "../record-item/path-override-policy.js";
import { PathRecord } from "../record-item/path-record.js";
import { ManualPathAudit, newManualPathAudit } from "./manual-path-audit.js";

export function summarizePathRecordsForAudit(items: PathRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualPathAuditsFromRecord(items: PathRecord[]): ManualPathAudit[] {
  const out: ManualPathAudit[] = [];
  for (const item of items) {
    const derived = newManualPathAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignManualPathAudit(item: ManualPathAudit): string {
  return normalizePathOverrideCode(item.code);
}
