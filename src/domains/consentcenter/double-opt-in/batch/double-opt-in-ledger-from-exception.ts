import { doubleOptInExceptionBucket } from "../preference/double-opt-in-exception-policy.js";
import { DoubleOptInException } from "../preference/double-opt-in-exception.js";
import { DoubleOptInLedger, newDoubleOptInLedger } from "./double-opt-in-ledger.js";

export function summarizeDoubleOptInExceptionsForLedger(items: DoubleOptInException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveDoubleOptInLedgersFromException(items: DoubleOptInException[]): DoubleOptInLedger[] {
  const out: DoubleOptInLedger[] = [];
  for (const item of items) {
    const derived = newDoubleOptInLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDoubleOptInLedger(item: DoubleOptInLedger): string {
  return doubleOptInExceptionBucket(item.adjustedVolume());
}
