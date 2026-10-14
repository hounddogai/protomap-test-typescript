import { proofOverrideWeight } from "../../proof/proof-agreement/proof-override-policy.js";
import { StrictProofEntry } from "../../proof/proof-agreement/strict-proof-entry.js";
import { AdaptiveDoubleOptInGroup, newAdaptiveDoubleOptInGroup } from "./adaptive-double-opt-in-group.js";

export function summarizeStrictProofEntriesForGroup(items: StrictProofEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveDoubleOptInGroupsFromEntry(items: StrictProofEntry[]): AdaptiveDoubleOptInGroup[] {
  const out: AdaptiveDoubleOptInGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveDoubleOptInGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveDoubleOptInGroup(item: AdaptiveDoubleOptInGroup): number {
  return proofOverrideWeight(6, true);
}
