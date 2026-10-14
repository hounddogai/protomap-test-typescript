import { classifyLegacyPathBatch } from "../../path/template/legacy-path-batch-policy.js";
import { ScheduledPathTemplate } from "../../path/template/scheduled-path-template.js";
import { CreditCycle, newCreditCycle } from "./credit-cycle.js";

export function summarizeScheduledPathTemplatesForCycle(items: ScheduledPathTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditCyclesFromTemplate(items: ScheduledPathTemplate[]): CreditCycle[] {
  const out: CreditCycle[] = [];
  for (const item of items) {
    const derived = newCreditCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCreditCycle(item: CreditCycle): string {
  return classifyLegacyPathBatch(item.measuredValue());
}
