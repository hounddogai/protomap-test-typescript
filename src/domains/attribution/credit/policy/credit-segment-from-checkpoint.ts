import { ModelCheckpoint } from "../../model/checkpoint/model-checkpoint.js";
import { normalizeModelGroupCode } from "../../model/checkpoint/model-group-policy.js";
import { CreditSegment, newCreditSegment } from "./credit-segment.js";

export function summarizeModelCheckpointsForSegment(items: ModelCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditSegmentsFromCheckpoint(items: ModelCheckpoint[]): CreditSegment[] {
  const out: CreditSegment[] = [];
  for (const item of items) {
    const derived = newCreditSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveCreditSegment(item: CreditSegment): string {
  return normalizeModelGroupCode(item.code);
}
