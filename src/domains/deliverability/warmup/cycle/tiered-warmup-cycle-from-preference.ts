import {
  normalizeLegacyComplaintPreferenceCode,
} from "../../complaint/preference/legacy-complaint-preference-policy.js";
import { LegacyComplaintPreference } from "../../complaint/preference/legacy-complaint-preference.js";
import { TieredWarmupCycle, newTieredWarmupCycle } from "./tiered-warmup-cycle.js";

export function summarizeLegacyComplaintPreferencesForCycle(items: LegacyComplaintPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredWarmupCyclesFromPreference(items: LegacyComplaintPreference[]): TieredWarmupCycle[] {
  const out: TieredWarmupCycle[] = [];
  for (const item of items) {
    const derived = newTieredWarmupCycle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTieredWarmupCycle(item: TieredWarmupCycle): string {
  return normalizeLegacyComplaintPreferenceCode(item.code);
}
