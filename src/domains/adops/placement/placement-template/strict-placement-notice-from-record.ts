import { normalizeAdaptivePlacementProposalCode } from "../placement-record/adaptive-placement-proposal-policy.js";
import { FallbackPlacementRecord } from "../placement-record/fallback-placement-record.js";
import { StrictPlacementNotice, newStrictPlacementNotice } from "./strict-placement-notice.js";

export function summarizeFallbackPlacementRecordsForNotice(items: FallbackPlacementRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStrictPlacementNoticesFromRecord(items: FallbackPlacementRecord[]): StrictPlacementNotice[] {
  const out: StrictPlacementNotice[] = [];
  for (const item of items) {
    const derived = newStrictPlacementNotice(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankStrictPlacementNotice(item: StrictPlacementNotice): string {
  return normalizeAdaptivePlacementProposalCode(item.code);
}
