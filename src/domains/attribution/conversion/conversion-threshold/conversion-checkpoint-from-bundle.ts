import { normalizeBatchedConversionBundleCode } from "../audit/batched-conversion-bundle-policy.js";
import { BatchedConversionBundle } from "../audit/batched-conversion-bundle.js";
import { ConversionCheckpoint, newConversionCheckpoint } from "./conversion-checkpoint.js";

export function summarizeBatchedConversionBundlesForCheckpoint(items: BatchedConversionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveConversionCheckpointsFromBundle(items: BatchedConversionBundle[]): ConversionCheckpoint[] {
  const out: ConversionCheckpoint[] = [];
  for (const item of items) {
    const derived = newConversionCheckpoint(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyConversionCheckpoint(item: ConversionCheckpoint): string {
  return normalizeBatchedConversionBundleCode(item.code);
}
