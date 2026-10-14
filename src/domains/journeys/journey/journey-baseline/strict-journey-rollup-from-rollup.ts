import { LegacyWaitRollup } from "../../wait/profile/legacy-wait-rollup.js";
import { classifyWeightedWaitProfile } from "../../wait/profile/weighted-wait-profile-policy.js";
import { StrictJourneyRollup, newStrictJourneyRollup } from "./strict-journey-rollup.js";

export function summarizeLegacyWaitRollupsForRollup(items: LegacyWaitRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveStrictJourneyRollupsFromRollup(items: LegacyWaitRollup[]): StrictJourneyRollup[] {
  const out: StrictJourneyRollup[] = [];
  for (const item of items) {
    const derived = newStrictJourneyRollup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyStrictJourneyRollup(item: StrictJourneyRollup): string {
  return classifyWeightedWaitProfile(item.projectedTotal());
}
