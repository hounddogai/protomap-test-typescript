import { pacingBaselineBucket } from "../../pacing/audit/pacing-baseline-policy.js";
import { PacingBaseline } from "../../pacing/audit/pacing-baseline.js";
import { CreativeCycle, newCreativeCycle } from "./creative-cycle.js";

export function summarizePacingBaselinesForCycle(items: PacingBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCreativeCyclesFromBaseline(items: PacingBaseline[]): CreativeCycle[] {
  const out: CreativeCycle[] = [];
  for (const item of items) {
    const derived = newCreativeCycle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeCreativeCycle(item: CreativeCycle): string {
  return pacingBaselineBucket(item.adjustedValue());
}
