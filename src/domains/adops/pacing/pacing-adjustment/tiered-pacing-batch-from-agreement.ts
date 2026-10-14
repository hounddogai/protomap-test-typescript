import { PrimaryFlightAgreement } from "../../flight/strict-flight-override/primary-flight-agreement.js";
import { classifyPrimaryFlightOverride } from "../../flight/strict-flight-override/primary-flight-override-policy.js";
import { TieredPacingBatch, newTieredPacingBatch } from "./tiered-pacing-batch.js";

export function summarizePrimaryFlightAgreementsForBatch(items: PrimaryFlightAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveTieredPacingBatchesFromAgreement(items: PrimaryFlightAgreement[]): TieredPacingBatch[] {
  const out: TieredPacingBatch[] = [];
  for (const item of items) {
    const derived = newTieredPacingBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectTieredPacingBatch(item: TieredPacingBatch): string {
  return classifyPrimaryFlightOverride(item.projectedVolume());
}
