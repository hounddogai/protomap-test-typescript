import {
  classifyLenientDeflectionSegment,
} from "../../deflection/deflection-tier/lenient-deflection-segment-policy.js";
import { LenientDeflectionSegment } from "../../deflection/deflection-tier/lenient-deflection-segment.js";
import { MacroAgreement, newMacroAgreement } from "./macro-agreement.js";

export function summarizeLenientDeflectionSegmentsForAgreement(items: LenientDeflectionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveMacroAgreementsFromSegment(items: LenientDeflectionSegment[]): MacroAgreement[] {
  const out: MacroAgreement[] = [];
  for (const item of items) {
    const derived = newMacroAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeMacroAgreement(item: MacroAgreement): string {
  return classifyLenientDeflectionSegment(item.measuredValue());
}
