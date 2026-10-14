import { normalizeLenientPlacementDigestCode } from "../../placement/reservation/lenient-placement-digest-policy.js";
import { RollingPlacementLedger } from "../../placement/reservation/rolling-placement-ledger.js";
import { BatchedFrequencyRollup, newBatchedFrequencyRollup } from "./batched-frequency-rollup.js";

export function summarizeRollingPlacementLedgersForRollup(items: RollingPlacementLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveBatchedFrequencyRollupsFromLedger(items: RollingPlacementLedger[]): BatchedFrequencyRollup[] {
  const out: BatchedFrequencyRollup[] = [];
  for (const item of items) {
    const derived = newBatchedFrequencyRollup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyBatchedFrequencyRollup(item: BatchedFrequencyRollup): string {
  return normalizeLenientPlacementDigestCode(item.code);
}
