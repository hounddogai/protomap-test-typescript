import { classifyAdaptiveQueueProposal } from "../../queue/forecast/adaptive-queue-proposal-policy.js";
import { AdaptiveQueueProposal } from "../../queue/forecast/adaptive-queue-proposal.js";
import { DefaultInsightAdjustment, newDefaultInsightAdjustment } from "./default-insight-adjustment.js";

export function summarizeAdaptiveQueueProposalsForAdjustment(items: AdaptiveQueueProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDefaultInsightAdjustmentsFromProposal(items: AdaptiveQueueProposal[]): DefaultInsightAdjustment[] {
  const out: DefaultInsightAdjustment[] = [];
  for (const item of items) {
    const derived = newDefaultInsightAdjustment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileDefaultInsightAdjustment(item: DefaultInsightAdjustment): string {
  return classifyAdaptiveQueueProposal(item.effectiveVolume());
}
