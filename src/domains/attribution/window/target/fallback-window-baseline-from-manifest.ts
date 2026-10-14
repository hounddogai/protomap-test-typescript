import {
  normalizeBatchedConversionReservationCode,
} from "../../conversion/manifest/batched-conversion-reservation-policy.js";
import { ConversionManifest } from "../../conversion/manifest/conversion-manifest.js";
import { FallbackWindowBaseline, newFallbackWindowBaseline } from "./fallback-window-baseline.js";

export function summarizeConversionManifestsForBaseline(items: ConversionManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveFallbackWindowBaselinesFromManifest(items: ConversionManifest[]): FallbackWindowBaseline[] {
  const out: FallbackWindowBaseline[] = [];
  for (const item of items) {
    const derived = newFallbackWindowBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateFallbackWindowBaseline(item: FallbackWindowBaseline): string {
  return normalizeBatchedConversionReservationCode(item.code);
}
