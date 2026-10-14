import { DefaultPreferenceMilestone } from "../../preference/preference-baseline/default-preference-milestone.js";
import {
  normalizeManualPreferenceBaselineCode,
} from "../../preference/preference-baseline/manual-preference-baseline-policy.js";
import { LenientDoubleOptInBundle, newLenientDoubleOptInBundle } from "./lenient-double-opt-in-bundle.js";

export function summarizeDefaultPreferenceMilestonesForBundle(items: DefaultPreferenceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientDoubleOptInBundlesFromMilestone(items: DefaultPreferenceMilestone[]): LenientDoubleOptInBundle[] {
  const out: LenientDoubleOptInBundle[] = [];
  for (const item of items) {
    const derived = newLenientDoubleOptInBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreLenientDoubleOptInBundle(item: LenientDoubleOptInBundle): string {
  return normalizeManualPreferenceBaselineCode(item.code);
}
