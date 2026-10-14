import { classifyManualCreativeAudit } from "../../creative/score/manual-creative-audit-policy.js";
import { SeasonalCreativeLedger } from "../../creative/score/seasonal-creative-ledger.js";
import { TieredPacingBatch, newTieredPacingBatch } from "./tiered-pacing-batch.js";

export function summarizeSeasonalCreativeLedgersForBatch(items: SeasonalCreativeLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredPacingBatchesFromLedger(items: SeasonalCreativeLedger[]): TieredPacingBatch[] {
  const out: TieredPacingBatch[] = [];
  for (const item of items) {
    const derived = newTieredPacingBatch(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitTieredPacingBatch(item: TieredPacingBatch): string {
  return classifyManualCreativeAudit(item.projectedVolume());
}
