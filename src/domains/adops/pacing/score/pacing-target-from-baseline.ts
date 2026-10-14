import { pacingAuditBucket } from "../audit/pacing-audit-policy.js";
import { PacingBaseline } from "../audit/pacing-baseline.js";
import { PacingTarget, newPacingTarget } from "./pacing-target.js";

export function summarizePacingBaselinesForTarget(items: PacingBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePacingTargetsFromBaseline(items: PacingBaseline[]): PacingTarget[] {
  const out: PacingTarget[] = [];
  for (const item of items) {
    const derived = newPacingTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computePacingTarget(item: PacingTarget): string {
  return pacingAuditBucket(item.adjustedValue());
}
