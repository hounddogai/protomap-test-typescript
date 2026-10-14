import { LenientWaitMapping } from "../../wait/target/lenient-wait-mapping.js";
import { classifyManualWaitTarget } from "../../wait/target/manual-wait-target-policy.js";
import { SeasonalBranchBundle, newSeasonalBranchBundle } from "./seasonal-branch-bundle.js";

export function summarizeLenientWaitMappingsForBundle(items: LenientWaitMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalBranchBundlesFromMapping(items: LenientWaitMapping[]): SeasonalBranchBundle[] {
  const out: SeasonalBranchBundle[] = [];
  for (const item of items) {
    const derived = newSeasonalBranchBundle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalBranchBundle(item: SeasonalBranchBundle): string {
  return classifyManualWaitTarget(item.weightedTotal());
}
