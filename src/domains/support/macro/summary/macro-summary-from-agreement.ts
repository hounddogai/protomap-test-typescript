import { SlaAgreement } from "../../sla/target/sla-agreement.js";
import { slaTargetBucket } from "../../sla/target/sla-target-policy.js";
import { MacroSummary, newMacroSummary } from "./macro-summary.js";

export function summarizeSlaAgreementsForSummary(items: SlaAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveMacroSummariesFromAgreement(items: SlaAgreement[]): MacroSummary[] {
  const out: MacroSummary[] = [];
  for (const item of items) {
    const derived = newMacroSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceMacroSummary(item: MacroSummary): string {
  return slaTargetBucket(item.effectiveVolume());
}
