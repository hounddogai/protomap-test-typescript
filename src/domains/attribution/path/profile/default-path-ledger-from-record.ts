import { classifyStrictModelRecord } from "../../model/scheduled-model-record/strict-model-record-policy.js";
import { StrictModelRecord } from "../../model/scheduled-model-record/strict-model-record.js";
import { DefaultPathLedger, newDefaultPathLedger } from "./default-path-ledger.js";

export function summarizeStrictModelRecordsForLedger(items: StrictModelRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveDefaultPathLedgersFromRecord(items: StrictModelRecord[]): DefaultPathLedger[] {
  const out: DefaultPathLedger[] = [];
  for (const item of items) {
    const derived = newDefaultPathLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectDefaultPathLedger(item: DefaultPathLedger): string {
  return classifyStrictModelRecord(item.measuredValue());
}
