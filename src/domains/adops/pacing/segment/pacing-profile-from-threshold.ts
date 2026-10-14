import { bidRuleSlotWeight } from "../../bid-rule/notice/bid-rule-slot-policy.js";
import { LegacyBidRuleThreshold } from "../../bid-rule/notice/legacy-bid-rule-threshold.js";
import { PacingProfile, newPacingProfile } from "./pacing-profile.js";

export function summarizeLegacyBidRuleThresholdsForProfile(items: LegacyBidRuleThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePacingProfilesFromThreshold(items: LegacyBidRuleThreshold[]): PacingProfile[] {
  const out: PacingProfile[] = [];
  for (const item of items) {
    const derived = newPacingProfile(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergePacingProfile(item: PacingProfile): number {
  return bidRuleSlotWeight(1, true);
}
