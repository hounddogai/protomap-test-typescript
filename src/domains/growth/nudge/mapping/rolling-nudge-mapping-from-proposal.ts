import { adaptiveCohortScoreWeight } from "../../cohort/score/adaptive-cohort-score-policy.js";
import { SeasonalCohortProposal } from "../../cohort/score/seasonal-cohort-proposal.js";
import { RollingNudgeMapping, newRollingNudgeMapping } from "./rolling-nudge-mapping.js";

export function summarizeSeasonalCohortProposalsForMapping(items: SeasonalCohortProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRollingNudgeMappingsFromProposal(items: SeasonalCohortProposal[]): RollingNudgeMapping[] {
  const out: RollingNudgeMapping[] = [];
  for (const item of items) {
    const derived = newRollingNudgeMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRollingNudgeMapping(item: RollingNudgeMapping): number {
  return adaptiveCohortScoreWeight(5, true);
}
