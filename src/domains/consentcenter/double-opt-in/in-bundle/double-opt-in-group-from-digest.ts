import { DoubleOptInDigest } from "../in-baseline/double-opt-in-digest.js";
import { normalizeWeightedDoubleOptInBaselineCode } from "../in-baseline/weighted-double-opt-in-baseline-policy.js";
import { DoubleOptInGroup, newDoubleOptInGroup } from "./double-opt-in-group.js";

export function summarizeDoubleOptInDigestsForGroup(items: DoubleOptInDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDoubleOptInGroupsFromDigest(items: DoubleOptInDigest[]): DoubleOptInGroup[] {
  const out: DoubleOptInGroup[] = [];
  for (const item of items) {
    const derived = newDoubleOptInGroup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignDoubleOptInGroup(item: DoubleOptInGroup): string {
  return normalizeWeightedDoubleOptInBaselineCode(item.code);
}
