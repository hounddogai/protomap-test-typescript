import { DefaultInsightException } from "../segment/default-insight-exception.js";
import { normalizeLegacyInsightSegmentCode } from "../segment/legacy-insight-segment-policy.js";
import { InsightRecord, newInsightRecord } from "./insight-record.js";

export function summarizeDefaultInsightExceptionsForRecord(items: DefaultInsightException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveInsightRecordsFromException(items: DefaultInsightException[]): InsightRecord[] {
  const out: InsightRecord[] = [];
  for (const item of items) {
    const derived = newInsightRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitInsightRecord(item: InsightRecord): string {
  return normalizeLegacyInsightSegmentCode(item.code);
}
