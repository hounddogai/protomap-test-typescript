import {
  batchedInsightAllocationBucket,
} from "../../insight/insight-allocation/batched-insight-allocation-policy.js";
import { InsightBundle } from "../../insight/insight-allocation/insight-bundle.js";
import { DefaultMentionAdjustment, newDefaultMentionAdjustment } from "./default-mention-adjustment.js";

export function summarizeInsightBundlesForAdjustment(items: InsightBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveDefaultMentionAdjustmentsFromBundle(items: InsightBundle[]): DefaultMentionAdjustment[] {
  const out: DefaultMentionAdjustment[] = [];
  for (const item of items) {
    const derived = newDefaultMentionAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitDefaultMentionAdjustment(item: DefaultMentionAdjustment): string {
  return batchedInsightAllocationBucket(item.adjustedVolume());
}
