import { BatchedFrequencyCycle } from "../../frequency/frequency-cycle/batched-frequency-cycle.js";
import { globalFrequencyNoticeBucket } from "../../frequency/frequency-cycle/global-frequency-notice-policy.js";
import { RollingCreativeSummary, newRollingCreativeSummary } from "./rolling-creative-summary.js";

export function summarizeBatchedFrequencyCyclesForSummary(items: BatchedFrequencyCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveRollingCreativeSummariesFromCycle(items: BatchedFrequencyCycle[]): RollingCreativeSummary[] {
  const out: RollingCreativeSummary[] = [];
  for (const item of items) {
    const derived = newRollingCreativeSummary(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRollingCreativeSummary(item: RollingCreativeSummary): string {
  return globalFrequencyNoticeBucket(item.netVolume());
}
