import {
  batchedInsightAllocationBucket,
} from "../../insight/insight-allocation/batched-insight-allocation-policy.js";
import { InsightBundle } from "../../insight/insight-allocation/insight-bundle.js";
import { CappedReplyLedger, newCappedReplyLedger } from "./capped-reply-ledger.js";

export function summarizeInsightBundlesForLedger(items: InsightBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCappedReplyLedgersFromBundle(items: InsightBundle[]): CappedReplyLedger[] {
  const out: CappedReplyLedger[] = [];
  for (const item of items) {
    const derived = newCappedReplyLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCappedReplyLedger(item: CappedReplyLedger): string {
  return batchedInsightAllocationBucket(item.measuredValue());
}
