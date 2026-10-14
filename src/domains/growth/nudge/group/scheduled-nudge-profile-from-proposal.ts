import { rollingNudgeProposalBucket } from "../entry/rolling-nudge-proposal-policy.js";
import { RollingNudgeProposal } from "../entry/rolling-nudge-proposal.js";
import { ScheduledNudgeProfile, newScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

export function summarizeRollingNudgeProposalsForProfile(items: RollingNudgeProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveScheduledNudgeProfilesFromProposal(items: RollingNudgeProposal[]): ScheduledNudgeProfile[] {
  const out: ScheduledNudgeProfile[] = [];
  for (const item of items) {
    const derived = newScheduledNudgeProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeScheduledNudgeProfile(item: ScheduledNudgeProfile): string {
  return rollingNudgeProposalBucket(item.projectedVolume());
}
