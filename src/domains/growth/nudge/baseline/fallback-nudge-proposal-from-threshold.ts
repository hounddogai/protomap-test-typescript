import {
  normalizeCappedRetentionAllocationCode,
} from "../../retention/threshold/capped-retention-allocation-policy.js";
import { RetentionThreshold } from "../../retention/threshold/retention-threshold.js";
import { FallbackNudgeProposal, newFallbackNudgeProposal } from "./fallback-nudge-proposal.js";

export function summarizeRetentionThresholdsForProposal(items: RetentionThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFallbackNudgeProposalsFromThreshold(items: RetentionThreshold[]): FallbackNudgeProposal[] {
  const out: FallbackNudgeProposal[] = [];
  for (const item of items) {
    const derived = newFallbackNudgeProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceFallbackNudgeProposal(item: FallbackNudgeProposal): string {
  return normalizeCappedRetentionAllocationCode(item.code);
}
