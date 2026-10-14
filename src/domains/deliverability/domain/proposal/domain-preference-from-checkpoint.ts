import { normalizeAdaptiveWarmupReviewCode } from "../../warmup/entry/adaptive-warmup-review-policy.js";
import { WarmupCheckpoint } from "../../warmup/entry/warmup-checkpoint.js";
import { DomainPreference, newDomainPreference } from "./domain-preference.js";

export function summarizeWarmupCheckpointsForPreference(items: WarmupCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDomainPreferencesFromCheckpoint(items: WarmupCheckpoint[]): DomainPreference[] {
  const out: DomainPreference[] = [];
  for (const item of items) {
    const derived = newDomainPreference(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreDomainPreference(item: DomainPreference): string {
  return normalizeAdaptiveWarmupReviewCode(item.code);
}
