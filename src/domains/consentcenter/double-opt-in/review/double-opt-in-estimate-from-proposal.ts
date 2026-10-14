import { adaptivePreferenceTargetBucket } from "../../preference/snapshot/adaptive-preference-target-policy.js";
import { FallbackPreferenceProposal } from "../../preference/snapshot/fallback-preference-proposal.js";
import { DoubleOptInEstimate, newDoubleOptInEstimate } from "./double-opt-in-estimate.js";

export function summarizeFallbackPreferenceProposalsForEstimate(items: FallbackPreferenceProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveDoubleOptInEstimatesFromProposal(items: FallbackPreferenceProposal[]): DoubleOptInEstimate[] {
  const out: DoubleOptInEstimate[] = [];
  for (const item of items) {
    const derived = newDoubleOptInEstimate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeDoubleOptInEstimate(item: DoubleOptInEstimate): string {
  return adaptivePreferenceTargetBucket(item.effectiveExposure());
}
