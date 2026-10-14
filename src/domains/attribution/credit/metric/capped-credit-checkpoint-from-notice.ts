import { LenientModelNotice } from "../../model/digest/lenient-model-notice.js";
import { modelForecastBucket } from "../../model/digest/model-forecast-policy.js";
import { CappedCreditCheckpoint, newCappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

export function summarizeLenientModelNoticesForCheckpoint(items: LenientModelNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveCappedCreditCheckpointsFromNotice(items: LenientModelNotice[]): CappedCreditCheckpoint[] {
  const out: CappedCreditCheckpoint[] = [];
  for (const item of items) {
    const derived = newCappedCreditCheckpoint(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceCappedCreditCheckpoint(item: CappedCreditCheckpoint): string {
  return modelForecastBucket(item.measuredValue());
}
