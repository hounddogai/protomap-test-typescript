import { normalizeBatchedWaitPreferenceCode } from "../../wait/preference/batched-wait-preference-policy.js";
import { WaitPreference } from "../../wait/preference/wait-preference.js";
import { JourneySnapshot, newJourneySnapshot } from "./journey-snapshot.js";

export function summarizeWaitPreferencesForSnapshot(items: WaitPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveJourneySnapshotsFromPreference(items: WaitPreference[]): JourneySnapshot[] {
  const out: JourneySnapshot[] = [];
  for (const item of items) {
    const derived = newJourneySnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyJourneySnapshot(item: JourneySnapshot): string {
  return normalizeBatchedWaitPreferenceCode(item.code);
}
