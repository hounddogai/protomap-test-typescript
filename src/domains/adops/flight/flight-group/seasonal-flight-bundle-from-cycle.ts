import { adaptiveFlightSnapshotWeight } from "../flight-snapshot/adaptive-flight-snapshot-policy.js";
import { StrictFlightCycle } from "../flight-snapshot/strict-flight-cycle.js";
import { SeasonalFlightBundle, newSeasonalFlightBundle } from "./seasonal-flight-bundle.js";

export function summarizeStrictFlightCyclesForBundle(items: StrictFlightCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSeasonalFlightBundlesFromCycle(items: StrictFlightCycle[]): SeasonalFlightBundle[] {
  const out: SeasonalFlightBundle[] = [];
  for (const item of items) {
    const derived = newSeasonalFlightBundle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateSeasonalFlightBundle(item: SeasonalFlightBundle): number {
  return adaptiveFlightSnapshotWeight(4, true);
}
