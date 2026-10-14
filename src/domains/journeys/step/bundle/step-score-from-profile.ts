import { classifyWeightedWaitProfile } from "../../wait/profile/weighted-wait-profile-policy.js";
import { WeightedWaitProfile } from "../../wait/profile/weighted-wait-profile.js";
import { StepScore, newStepScore } from "./step-score.js";

export function summarizeWeightedWaitProfilesForScore(items: WeightedWaitProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveStepScoresFromProfile(items: WeightedWaitProfile[]): StepScore[] {
  const out: StepScore[] = [];
  for (const item of items) {
    const derived = newStepScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectStepScore(item: StepScore): string {
  return classifyWeightedWaitProfile(item.weightedVolume());
}
