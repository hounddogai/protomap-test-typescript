import { FallbackFrequencyCycle } from "../../frequency/estimate/fallback-frequency-cycle.js";
import { classifyGlobalFrequencyClaim } from "../../frequency/estimate/global-frequency-claim-policy.js";
import { StrictPacingBaseline, newStrictPacingBaseline } from "./strict-pacing-baseline.js";

export function summarizeFallbackFrequencyCyclesForBaseline(items: FallbackFrequencyCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStrictPacingBaselinesFromCycle(items: FallbackFrequencyCycle[]): StrictPacingBaseline[] {
  const out: StrictPacingBaseline[] = [];
  for (const item of items) {
    const derived = newStrictPacingBaseline(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankStrictPacingBaseline(item: StrictPacingBaseline): string {
  return classifyGlobalFrequencyClaim(item.weightedTotal());
}
