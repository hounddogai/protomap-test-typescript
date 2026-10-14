import { creativeSummaryWeight } from "../../creative/ledger/creative-summary-policy.js";
import { CreativeTarget } from "../../creative/ledger/creative-target.js";
import { AdaptiveFlightGroup, newAdaptiveFlightGroup } from "./adaptive-flight-group.js";

export function summarizeCreativeTargetsForGroup(items: CreativeTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveFlightGroupsFromTarget(items: CreativeTarget[]): AdaptiveFlightGroup[] {
  const out: AdaptiveFlightGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveFlightGroup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptiveFlightGroup(item: AdaptiveFlightGroup): number {
  return creativeSummaryWeight(8, true);
}
