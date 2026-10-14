import { manualFlightCheckpointWeight } from "../../flight/cycle/manual-flight-checkpoint-policy.js";
import { ManualFlightCheckpoint } from "../../flight/cycle/manual-flight-checkpoint.js";
import { ManualCreativeSummary, newManualCreativeSummary } from "./manual-creative-summary.js";

export function summarizeManualFlightCheckpointsForSummary(items: ManualFlightCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualCreativeSummariesFromCheckpoint(items: ManualFlightCheckpoint[]): ManualCreativeSummary[] {
  const out: ManualCreativeSummary[] = [];
  for (const item of items) {
    const derived = newManualCreativeSummary(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planManualCreativeSummary(item: ManualCreativeSummary): number {
  return manualFlightCheckpointWeight(3, true);
}
