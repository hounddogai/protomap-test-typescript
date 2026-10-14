import { classifyCreativeBundle } from "../../creative/allocation/creative-bundle-policy.js";
import { CreativeBundle } from "../../creative/allocation/creative-bundle.js";
import { FrequencyRecord, newFrequencyRecord } from "./frequency-record.js";

export function summarizeCreativeBundlesForRecord(items: CreativeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveFrequencyRecordsFromBundle(items: CreativeBundle[]): FrequencyRecord[] {
  const out: FrequencyRecord[] = [];
  for (const item of items) {
    const derived = newFrequencyRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFrequencyRecordExtra(item: FrequencyRecord): string {
  return classifyCreativeBundle(item.adjustedValue());
}
