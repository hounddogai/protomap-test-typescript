import { ModelDigest } from "../digest/model-digest.js";
import { modelPreferenceWeight } from "../digest/model-preference-policy.js";
import { RegionalModelGroup, newRegionalModelGroup } from "./regional-model-group.js";

export function summarizeModelDigestsForGroup(items: ModelDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRegionalModelGroupsFromDigest(items: ModelDigest[]): RegionalModelGroup[] {
  const out: RegionalModelGroup[] = [];
  for (const item of items) {
    const derived = newRegionalModelGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRegionalModelGroup(item: RegionalModelGroup): number {
  return modelPreferenceWeight(6, true);
}
