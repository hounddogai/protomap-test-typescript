import { FallbackNudgeProposal } from "../../nudge/baseline/fallback-nudge-proposal.js";
import { regionalNudgeBaselineWeight } from "../../nudge/baseline/regional-nudge-baseline-policy.js";
import { ManualFunnelManifest, newManualFunnelManifest } from "./manual-funnel-manifest.js";

export function summarizeFallbackNudgeProposalsForManifest(items: FallbackNudgeProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveManualFunnelManifestsFromProposal(items: FallbackNudgeProposal[]): ManualFunnelManifest[] {
  const out: ManualFunnelManifest[] = [];
  for (const item of items) {
    const derived = newManualFunnelManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateManualFunnelManifest(item: ManualFunnelManifest): number {
  return regionalNudgeBaselineWeight(5, true);
}
