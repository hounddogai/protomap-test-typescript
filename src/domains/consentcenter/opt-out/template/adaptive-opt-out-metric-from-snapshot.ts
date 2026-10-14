import { PreferenceSnapshot } from "../../preference/snapshot/preference-snapshot.js";
import {
  scheduledPreferenceAssignmentWeight,
} from "../../preference/snapshot/scheduled-preference-assignment-policy.js";
import { AdaptiveOptOutMetric, newAdaptiveOptOutMetric } from "./adaptive-opt-out-metric.js";

export function summarizePreferenceSnapshotsForMetric(items: PreferenceSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveAdaptiveOptOutMetricsFromSnapshot(items: PreferenceSnapshot[]): AdaptiveOptOutMetric[] {
  const out: AdaptiveOptOutMetric[] = [];
  for (const item of items) {
    const derived = newAdaptiveOptOutMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveOptOutMetric(item: AdaptiveOptOutMetric): number {
  return scheduledPreferenceAssignmentWeight(1, true);
}
