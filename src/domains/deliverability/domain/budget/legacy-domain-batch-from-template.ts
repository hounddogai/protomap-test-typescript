import { LenientWarmupTemplate } from "../../warmup/warmup-estimate/lenient-warmup-template.js";
import { warmupCycleBucket } from "../../warmup/warmup-estimate/warmup-cycle-policy.js";
import { LegacyDomainBatch, newLegacyDomainBatch } from "./legacy-domain-batch.js";

export function summarizeLenientWarmupTemplatesForBatch(items: LenientWarmupTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyDomainBatchesFromTemplate(items: LenientWarmupTemplate[]): LegacyDomainBatch[] {
  const out: LegacyDomainBatch[] = [];
  for (const item of items) {
    const derived = newLegacyDomainBatch(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveLegacyDomainBatch(item: LegacyDomainBatch): string {
  return warmupCycleBucket(item.effectiveValue());
}
