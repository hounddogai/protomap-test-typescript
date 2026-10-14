import { FrequencyCycle } from "../../frequency/baseline/frequency-cycle.js";
import { regionalFrequencyBatchBucket } from "../../frequency/baseline/regional-frequency-batch-policy.js";
import { CappedCreativeBundle, newCappedCreativeBundle } from "./capped-creative-bundle.js";

export function summarizeFrequencyCyclesForBundle(items: FrequencyCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveCappedCreativeBundlesFromCycle(items: FrequencyCycle[]): CappedCreativeBundle[] {
  const out: CappedCreativeBundle[] = [];
  for (const item of items) {
    const derived = newCappedCreativeBundle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitCappedCreativeBundle(item: CappedCreativeBundle): string {
  return regionalFrequencyBatchBucket(item.netTotal());
}
