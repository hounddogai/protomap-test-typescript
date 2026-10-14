import { JourneyOverride } from "../override-item/journey-override.js";
import { classifyRollingJourneyBaseline } from "../override-item/rolling-journey-baseline-policy.js";
import { RollingJourneyTarget, newRollingJourneyTarget } from "./rolling-journey-target.js";

export function summarizeJourneyOverridesForTarget(items: JourneyOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRollingJourneyTargetsFromOverride(items: JourneyOverride[]): RollingJourneyTarget[] {
  const out: RollingJourneyTarget[] = [];
  for (const item of items) {
    const derived = newRollingJourneyTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRollingJourneyTarget(item: RollingJourneyTarget): string {
  return classifyRollingJourneyBaseline(item.weightedTotal());
}
