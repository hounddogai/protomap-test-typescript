import { regionalModelAllocationBucket } from "../../model/model-allocation/regional-model-allocation-policy.js";
import { RegionalModelAllocation } from "../../model/model-allocation/regional-model-allocation.js";
import { FallbackConversionMapping, newFallbackConversionMapping } from "./fallback-conversion-mapping.js";

export function summarizeRegionalModelAllocationsForMapping(items: RegionalModelAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveFallbackConversionMappingsFromAllocation(items: RegionalModelAllocation[]): FallbackConversionMapping[] {
  const out: FallbackConversionMapping[] = [];
  for (const item of items) {
    const derived = newFallbackConversionMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankFallbackConversionMapping(item: FallbackConversionMapping): string {
  return regionalModelAllocationBucket(item.projectedValue());
}
