import { classifyPathAgreement } from "../../path/baseline/path-agreement-policy.js";
import { PathForecast } from "../../path/baseline/path-forecast.js";
import { ConversionManifest, newConversionManifest } from "./conversion-manifest.js";

export function summarizePathForecastsForManifest(items: PathForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveConversionManifestsFromForecast(items: PathForecast[]): ConversionManifest[] {
  const out: ConversionManifest[] = [];
  for (const item of items) {
    const derived = newConversionManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitConversionManifest(item: ConversionManifest): string {
  return classifyPathAgreement(item.weightedLoad());
}
