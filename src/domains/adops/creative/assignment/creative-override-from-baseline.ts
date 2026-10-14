import { strictPacingBaselineBucket } from "../../pacing/pacing-plan/strict-pacing-baseline-policy.js";
import { StrictPacingBaseline } from "../../pacing/pacing-plan/strict-pacing-baseline.js";
import { CreativeOverride, newCreativeOverride } from "./creative-override.js";

export function summarizeStrictPacingBaselinesForOverride(items: StrictPacingBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveCreativeOverridesFromBaseline(items: StrictPacingBaseline[]): CreativeOverride[] {
  const out: CreativeOverride[] = [];
  for (const item of items) {
    const derived = newCreativeOverride(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeCreativeOverride(item: CreativeOverride): string {
  return strictPacingBaselineBucket(item.weightedValue());
}
