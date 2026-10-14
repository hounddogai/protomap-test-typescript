import { GlobalStepAudit } from "../../step/target/global-step-audit.js";
import { lenientStepTargetWeight } from "../../step/target/lenient-step-target-policy.js";
import { WaitNotice, newWaitNotice } from "./wait-notice.js";

export function summarizeGlobalStepAuditsForNotice(items: GlobalStepAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveWaitNoticesFromAudit(items: GlobalStepAudit[]): WaitNotice[] {
  const out: WaitNotice[] = [];
  for (const item of items) {
    const derived = newWaitNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWaitNotice(item: WaitNotice): number {
  return lenientStepTargetWeight(7, true);
}
