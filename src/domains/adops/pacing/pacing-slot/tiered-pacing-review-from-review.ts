import { normalizeManualCreativeLedgerCode } from "../../creative/creative-slot/manual-creative-ledger-policy.js";
import { RollingCreativeReview } from "../../creative/creative-slot/rolling-creative-review.js";
import { TieredPacingReview, newTieredPacingReview } from "./tiered-pacing-review.js";

export function summarizeRollingCreativeReviewsForReview(items: RollingCreativeReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveTieredPacingReviewsFromReview(items: RollingCreativeReview[]): TieredPacingReview[] {
  const out: TieredPacingReview[] = [];
  for (const item of items) {
    const derived = newTieredPacingReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyTieredPacingReviewExtra(item: TieredPacingReview): string {
  return normalizeManualCreativeLedgerCode(item.code);
}
