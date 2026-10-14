import { globalPathAdjustmentBucket } from "../../path/adjustment/global-path-adjustment-policy.js";
import { PathSegment } from "../../path/adjustment/path-segment.js";
import { CreditSnapshot, newCreditSnapshot } from "./credit-snapshot.js";

export function summarizePathSegmentsForSnapshot(items: PathSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditSnapshotsFromSegment(items: PathSegment[]): CreditSnapshot[] {
  const out: CreditSnapshot[] = [];
  for (const item of items) {
    const derived = newCreditSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankCreditSnapshot(item: CreditSnapshot): string {
  return globalPathAdjustmentBucket(item.weightedExposure());
}
