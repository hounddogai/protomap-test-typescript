import { normalizePayoutAllocationCode } from "../budget/payout-allocation-policy.js";
import { PayoutAllocation } from "../budget/payout-allocation.js";
import { PayoutRecord, newPayoutRecord } from "./payout-record.js";

export function summarizePayoutAllocationsForRecord(items: PayoutAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePayoutRecordsFromAllocation(items: PayoutAllocation[]): PayoutRecord[] {
  const out: PayoutRecord[] = [];
  for (const item of items) {
    const derived = newPayoutRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePayoutRecord(item: PayoutRecord): string {
  return normalizePayoutAllocationCode(item.code);
}
