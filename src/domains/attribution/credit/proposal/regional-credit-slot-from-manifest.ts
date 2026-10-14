import {
  classifyBatchedConversionReservation,
} from "../../conversion/manifest/batched-conversion-reservation-policy.js";
import { ConversionManifest } from "../../conversion/manifest/conversion-manifest.js";
import { RegionalCreditSlot, newRegionalCreditSlot } from "./regional-credit-slot.js";

export function summarizeConversionManifestsForSlot(items: ConversionManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRegionalCreditSlotsFromManifest(items: ConversionManifest[]): RegionalCreditSlot[] {
  const out: RegionalCreditSlot[] = [];
  for (const item of items) {
    const derived = newRegionalCreditSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRegionalCreditSlot(item: RegionalCreditSlot): string {
  return classifyBatchedConversionReservation(item.effectiveVolume());
}
