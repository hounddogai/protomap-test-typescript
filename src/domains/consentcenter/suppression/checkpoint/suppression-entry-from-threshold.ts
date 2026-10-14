import { globalProofMappingBucket } from "../../proof/mapping/global-proof-mapping-policy.js";
import { ProofThreshold } from "../../proof/mapping/proof-threshold.js";
import { SuppressionEntry, newSuppressionEntry } from "./suppression-entry.js";

export function summarizeProofThresholdsForEntry(items: ProofThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSuppressionEntriesFromThreshold(items: ProofThreshold[]): SuppressionEntry[] {
  const out: SuppressionEntry[] = [];
  for (const item of items) {
    const derived = newSuppressionEntry(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignSuppressionEntry(item: SuppressionEntry): string {
  return globalProofMappingBucket(item.measuredValue());
}
