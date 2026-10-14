import {
  normalizePendingOptOutAssignmentCode,
} from "../../opt-out/out-assignment/pending-opt-out-assignment-policy.js";
import { RegionalOptOutBundle } from "../../opt-out/out-assignment/regional-opt-out-bundle.js";
import { RegionalSuppressionProfile, newRegionalSuppressionProfile } from "./regional-suppression-profile.js";

export function summarizeRegionalOptOutBundlesForProfile(items: RegionalOptOutBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRegionalSuppressionProfilesFromBundle(items: RegionalOptOutBundle[]): RegionalSuppressionProfile[] {
  const out: RegionalSuppressionProfile[] = [];
  for (const item of items) {
    const derived = newRegionalSuppressionProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitRegionalSuppressionProfile(item: RegionalSuppressionProfile): string {
  return normalizePendingOptOutAssignmentCode(item.code);
}
