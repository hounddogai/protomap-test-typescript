import { NudgeBaseline } from "../score/nudge-baseline.js";
import { nudgeMappingWeight } from "../score/nudge-mapping-policy.js";
import { NudgeProposal, newNudgeProposal } from "./nudge-proposal.js";

export function summarizeNudgeBaselinesForProposal(items: NudgeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveNudgeProposalsFromBaseline(items: NudgeBaseline[]): NudgeProposal[] {
  const out: NudgeProposal[] = [];
  for (const item of items) {
    const derived = newNudgeProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectNudgeProposal(item: NudgeProposal): number {
  return nudgeMappingWeight(9, true);
}
