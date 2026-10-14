import { warmupBatchBucket } from "../../warmup/batch/warmup-batch-policy.js";
import { WarmupBatch } from "../../warmup/batch/warmup-batch.js";
import { DomainMapping, newDomainMapping } from "./domain-mapping.js";

export function summarizeWarmupBatchesForMapping(items: WarmupBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDomainMappingsFromBatch(items: WarmupBatch[]): DomainMapping[] {
  const out: DomainMapping[] = [];
  for (const item of items) {
    const derived = newDomainMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDomainMapping(item: DomainMapping): string {
  return warmupBatchBucket(item.adjustedVolume());
}
