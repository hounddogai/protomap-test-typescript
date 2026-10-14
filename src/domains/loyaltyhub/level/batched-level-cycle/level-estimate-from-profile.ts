import {
  classifyRegionalChallengeProfile,
} from "../../challenge/challenge-exception/regional-challenge-profile-policy.js";
import { RegionalChallengeProfile } from "../../challenge/challenge-exception/regional-challenge-profile.js";
import { LevelEstimate, newLevelEstimate } from "./level-estimate.js";

export function summarizeRegionalChallengeProfilesForEstimate(items: RegionalChallengeProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLevelEstimatesFromProfile(items: RegionalChallengeProfile[]): LevelEstimate[] {
  const out: LevelEstimate[] = [];
  for (const item of items) {
    const derived = newLevelEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyLevelEstimate(item: LevelEstimate): string {
  return classifyRegionalChallengeProfile(item.projectedTotal());
}
