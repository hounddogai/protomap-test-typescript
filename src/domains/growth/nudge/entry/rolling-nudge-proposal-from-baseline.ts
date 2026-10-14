import { AdaptiveCohortBaseline } from "../../cohort/cohort-request/adaptive-cohort-baseline.js";
import { classifyCappedCohortPlan } from "../../cohort/cohort-request/capped-cohort-plan-policy.js";
import { RollingNudgeProposal, newRollingNudgeProposal } from "./rolling-nudge-proposal.js";

export function summarizeAdaptiveCohortBaselinesForProposal(items: AdaptiveCohortBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRollingNudgeProposalsFromBaseline(items: AdaptiveCohortBaseline[]): RollingNudgeProposal[] {
  const out: RollingNudgeProposal[] = [];
  for (const item of items) {
    const derived = newRollingNudgeProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRollingNudgeProposal(item: RollingNudgeProposal): string {
  return classifyCappedCohortPlan(item.netTotal());
}
