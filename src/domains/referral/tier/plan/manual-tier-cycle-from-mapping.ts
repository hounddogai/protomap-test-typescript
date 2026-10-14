import { lenientTierWindowWeight } from "../tier-window/lenient-tier-window-policy.js";
import { TierMapping } from "../tier-window/tier-mapping.js";
import { ManualTierCycle, newManualTierCycle } from "./manual-tier-cycle.js";

export function summarizeTierMappingsForCycle(items: TierMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveManualTierCyclesFromMapping(items: TierMapping[]): ManualTierCycle[] {
  const out: ManualTierCycle[] = [];
  for (const item of items) {
    const derived = newManualTierCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyManualTierCycle(item: ManualTierCycle): number {
  return lenientTierWindowWeight(4, true);
}
