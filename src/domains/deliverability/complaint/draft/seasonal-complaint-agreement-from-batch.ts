import { regionalWarmupVarianceWeight } from "../../warmup/manifest/regional-warmup-variance-policy.js";
import { SeasonalWarmupBatch } from "../../warmup/manifest/seasonal-warmup-batch.js";
import { SeasonalComplaintAgreement, newSeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

export function summarizeSeasonalWarmupBatchesForAgreement(items: SeasonalWarmupBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSeasonalComplaintAgreementsFromBatch(items: SeasonalWarmupBatch[]): SeasonalComplaintAgreement[] {
  const out: SeasonalComplaintAgreement[] = [];
  for (const item of items) {
    const derived = newSeasonalComplaintAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applySeasonalComplaintAgreement(item: SeasonalComplaintAgreement): number {
  return regionalWarmupVarianceWeight(8, true);
}
