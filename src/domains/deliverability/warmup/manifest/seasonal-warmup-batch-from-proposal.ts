import {
  normalizeGlobalReputationProposalCode,
} from "../../reputation/adjustment/global-reputation-proposal-policy.js";
import { GlobalReputationProposal } from "../../reputation/adjustment/global-reputation-proposal.js";
import { SeasonalWarmupBatch, newSeasonalWarmupBatch } from "./seasonal-warmup-batch.js";

export function summarizeGlobalReputationProposalsForBatch(items: GlobalReputationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSeasonalWarmupBatchesFromProposal(items: GlobalReputationProposal[]): SeasonalWarmupBatch[] {
  const out: SeasonalWarmupBatch[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeSeasonalWarmupBatch(item: SeasonalWarmupBatch): string {
  return normalizeGlobalReputationProposalCode(item.code);
}
