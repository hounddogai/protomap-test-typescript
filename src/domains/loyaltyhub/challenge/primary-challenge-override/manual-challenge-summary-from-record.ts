import { LenientLevelRecord } from "../../level/preference/lenient-level-record.js";
import { tieredLevelPreferenceWeight } from "../../level/preference/tiered-level-preference-policy.js";
import { ManualChallengeSummary, newManualChallengeSummary } from "./manual-challenge-summary.js";

export function summarizeLenientLevelRecordsForSummary(items: LenientLevelRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveManualChallengeSummariesFromRecord(items: LenientLevelRecord[]): ManualChallengeSummary[] {
  const out: ManualChallengeSummary[] = [];
  for (const item of items) {
    const derived = newManualChallengeSummary(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualChallengeSummary(item: ManualChallengeSummary): number {
  return tieredLevelPreferenceWeight(6, true);
}
