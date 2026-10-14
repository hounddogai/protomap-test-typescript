import { ConversionAudit } from "../../conversion/conversion-reservation/conversion-audit.js";
import {
  normalizeConversionPreferenceCode,
} from "../../conversion/conversion-reservation/conversion-preference-policy.js";
import { BatchedCreditRecord, newBatchedCreditRecord } from "./batched-credit-record.js";

export function summarizeConversionAuditsForRecord(items: ConversionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveBatchedCreditRecordsFromAudit(items: ConversionAudit[]): BatchedCreditRecord[] {
  const out: BatchedCreditRecord[] = [];
  for (const item of items) {
    const derived = newBatchedCreditRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeBatchedCreditRecord(item: BatchedCreditRecord): string {
  return normalizeConversionPreferenceCode(item.code);
}
