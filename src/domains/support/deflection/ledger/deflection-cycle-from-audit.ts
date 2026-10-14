import { DeflectionAudit } from "../assignment/deflection-audit.js";
import { deflectionNoticeBucket } from "../assignment/deflection-notice-policy.js";
import { DeflectionCycle, newDeflectionCycle } from "./deflection-cycle.js";

export function summarizeDeflectionAuditsForCycle(items: DeflectionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDeflectionCyclesFromAudit(items: DeflectionAudit[]): DeflectionCycle[] {
  const out: DeflectionCycle[] = [];
  for (const item of items) {
    const derived = newDeflectionCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeDeflectionCycle(item: DeflectionCycle): string {
  return deflectionNoticeBucket(item.adjustedVolume());
}
