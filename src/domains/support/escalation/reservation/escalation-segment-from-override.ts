import { normalizeStrictDeflectionOverrideCode } from "../../deflection/rule/strict-deflection-override-policy.js";
import { StrictDeflectionOverride } from "../../deflection/rule/strict-deflection-override.js";
import { EscalationSegment, newEscalationSegment } from "./escalation-segment.js";

export function summarizeStrictDeflectionOverridesForSegment(items: StrictDeflectionOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveEscalationSegmentsFromOverride(items: StrictDeflectionOverride[]): EscalationSegment[] {
  const out: EscalationSegment[] = [];
  for (const item of items) {
    const derived = newEscalationSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitEscalationSegment(item: EscalationSegment): string {
  return normalizeStrictDeflectionOverrideCode(item.code);
}
