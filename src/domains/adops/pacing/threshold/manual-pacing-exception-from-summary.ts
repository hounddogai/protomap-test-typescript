import { placementSummaryBucket } from "../../placement/placement-slot/placement-summary-policy.js";
import { PlacementSummary } from "../../placement/placement-slot/placement-summary.js";
import { ManualPacingException, newManualPacingException } from "./manual-pacing-exception.js";

export function summarizePlacementSummariesForException(items: PlacementSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveManualPacingExceptionsFromSummary(items: PlacementSummary[]): ManualPacingException[] {
  const out: ManualPacingException[] = [];
  for (const item of items) {
    const derived = newManualPacingException(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeManualPacingException(item: ManualPacingException): string {
  return placementSummaryBucket(item.projectedValue());
}
