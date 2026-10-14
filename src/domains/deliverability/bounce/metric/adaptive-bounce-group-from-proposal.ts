import { LenientWarmupProposal } from "../../warmup/notice/lenient-warmup-proposal.js";
import { classifyWarmupNotice } from "../../warmup/notice/warmup-notice-policy.js";
import { AdaptiveBounceGroup, newAdaptiveBounceGroup } from "./adaptive-bounce-group.js";

export function summarizeLenientWarmupProposalsForGroup(items: LenientWarmupProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveAdaptiveBounceGroupsFromProposal(items: LenientWarmupProposal[]): AdaptiveBounceGroup[] {
  const out: AdaptiveBounceGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveBounceGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveBounceGroup(item: AdaptiveBounceGroup): string {
  return classifyWarmupNotice(item.measuredValue());
}
