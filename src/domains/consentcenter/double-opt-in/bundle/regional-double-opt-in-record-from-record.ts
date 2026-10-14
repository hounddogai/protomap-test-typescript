import { normalizeSuppressionProposalCode } from "../../suppression/proposal/suppression-proposal-policy.js";
import { SuppressionRecord } from "../../suppression/proposal/suppression-record.js";
import { RegionalDoubleOptInRecord, newRegionalDoubleOptInRecord } from "./regional-double-opt-in-record.js";

export function summarizeSuppressionRecordsForRecord(items: SuppressionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalDoubleOptInRecordsFromRecord(items: SuppressionRecord[]): RegionalDoubleOptInRecord[] {
  const out: RegionalDoubleOptInRecord[] = [];
  for (const item of items) {
    const derived = newRegionalDoubleOptInRecord(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateRegionalDoubleOptInRecord(item: RegionalDoubleOptInRecord): string {
  return normalizeSuppressionProposalCode(item.code);
}
