import { classifyCreativeBundle } from "../../creative/allocation/creative-bundle-policy.js";
import { CreativeBundle } from "../../creative/allocation/creative-bundle.js";
import { PacingBaseline, newPacingBaseline } from "./pacing-baseline.js";

export function summarizeCreativeBundlesForBaseline(items: CreativeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePacingBaselinesFromBundle(items: CreativeBundle[]): PacingBaseline[] {
  const out: PacingBaseline[] = [];
  for (const item of items) {
    const derived = newPacingBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePacingBaseline(item: PacingBaseline): string {
  return classifyCreativeBundle(item.effectiveValue());
}
