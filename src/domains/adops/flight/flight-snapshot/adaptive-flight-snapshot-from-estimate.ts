import { DefaultPlacementEstimate } from "../../placement/placement-group/default-placement-estimate.js";
import {
  classifyLenientPlacementManifest,
} from "../../placement/placement-group/lenient-placement-manifest-policy.js";
import { AdaptiveFlightSnapshot, newAdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

export function summarizeDefaultPlacementEstimatesForSnapshot(items: DefaultPlacementEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveAdaptiveFlightSnapshotsFromEstimate(items: DefaultPlacementEstimate[]): AdaptiveFlightSnapshot[] {
  const out: AdaptiveFlightSnapshot[] = [];
  for (const item of items) {
    const derived = newAdaptiveFlightSnapshot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveFlightSnapshot(item: AdaptiveFlightSnapshot): string {
  return classifyLenientPlacementManifest(item.netLoad());
}
