import { AdaptiveCreativeForecast } from "../../creative/creative-forecast/adaptive-creative-forecast.js";
import { creativeSnapshotBucket } from "../../creative/creative-forecast/creative-snapshot-policy.js";
import { FlightAdjustment, newFlightAdjustment } from "./flight-adjustment.js";

export function summarizeAdaptiveCreativeForecastsForAdjustment(items: AdaptiveCreativeForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFlightAdjustmentsFromForecast(items: AdaptiveCreativeForecast[]): FlightAdjustment[] {
  const out: FlightAdjustment[] = [];
  for (const item of items) {
    const derived = newFlightAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceFlightAdjustment(item: FlightAdjustment): string {
  return creativeSnapshotBucket(item.projectedLoad());
}
