import { classifyStrictFrequencyProfile } from "../../frequency/claim/strict-frequency-profile-policy.js";
import { StrictFrequencyProfile } from "../../frequency/claim/strict-frequency-profile.js";
import { SeasonalPacingLedger, newSeasonalPacingLedger } from "./seasonal-pacing-ledger.js";

export function summarizeStrictFrequencyProfilesForLedger(items: StrictFrequencyProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSeasonalPacingLedgersFromProfile(items: StrictFrequencyProfile[]): SeasonalPacingLedger[] {
  const out: SeasonalPacingLedger[] = [];
  for (const item of items) {
    const derived = newSeasonalPacingLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySeasonalPacingLedger(item: SeasonalPacingLedger): string {
  return classifyStrictFrequencyProfile(item.adjustedVolume());
}
