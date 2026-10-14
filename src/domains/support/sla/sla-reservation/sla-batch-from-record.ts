import { lenientMacroRecordBucket } from "../../macro/checkpoint/lenient-macro-record-policy.js";
import { LenientMacroRecord } from "../../macro/checkpoint/lenient-macro-record.js";
import { SlaBatch, newSlaBatch } from "./sla-batch.js";

export function summarizeLenientMacroRecordsForBatch(items: LenientMacroRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSlaBatchesFromRecord(items: LenientMacroRecord[]): SlaBatch[] {
  const out: SlaBatch[] = [];
  for (const item of items) {
    const derived = newSlaBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchSlaBatch(item: SlaBatch): string {
  return lenientMacroRecordBucket(item.adjustedValue());
}
