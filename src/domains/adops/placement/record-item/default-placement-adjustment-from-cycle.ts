import { legacyCreativeOverrideBucket } from "../../creative/creative-cycle/legacy-creative-override-policy.js";
import { StrictCreativeCycle } from "../../creative/creative-cycle/strict-creative-cycle.js";
import { DefaultPlacementAdjustment, newDefaultPlacementAdjustment } from "./default-placement-adjustment.js";

export function summarizeStrictCreativeCyclesForAdjustment(items: StrictCreativeCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultPlacementAdjustmentsFromCycle(items: StrictCreativeCycle[]): DefaultPlacementAdjustment[] {
  const out: DefaultPlacementAdjustment[] = [];
  for (const item of items) {
    const derived = newDefaultPlacementAdjustment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreDefaultPlacementAdjustment(item: DefaultPlacementAdjustment): string {
  return legacyCreativeOverrideBucket(item.effectiveVolume());
}
