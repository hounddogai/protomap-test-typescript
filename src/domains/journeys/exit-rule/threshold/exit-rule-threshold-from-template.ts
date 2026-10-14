import { batchedWaitPolicyBucket } from "../../wait/wait-policy/batched-wait-policy-policy.js";
import { WaitTemplate } from "../../wait/wait-policy/wait-template.js";
import { ExitRuleThreshold, newExitRuleThreshold } from "./exit-rule-threshold.js";

export function summarizeWaitTemplatesForThreshold(items: WaitTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveExitRuleThresholdsFromTemplate(items: WaitTemplate[]): ExitRuleThreshold[] {
  const out: ExitRuleThreshold[] = [];
  for (const item of items) {
    const derived = newExitRuleThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreExitRuleThreshold(item: ExitRuleThreshold): string {
  return batchedWaitPolicyBucket(item.netTotal());
}
