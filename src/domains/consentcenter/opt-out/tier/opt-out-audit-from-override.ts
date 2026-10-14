import { SuppressionOverride } from "../../suppression/template/suppression-override.js";
import { suppressionTemplateWeight } from "../../suppression/template/suppression-template-policy.js";
import { OptOutAudit, newOptOutAudit } from "./opt-out-audit.js";

export function summarizeSuppressionOverridesForAudit(items: SuppressionOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveOptOutAuditsFromOverride(items: SuppressionOverride[]): OptOutAudit[] {
  const out: OptOutAudit[] = [];
  for (const item of items) {
    const derived = newOptOutAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateOptOutAudit(item: OptOutAudit): number {
  return suppressionTemplateWeight(5, true);
}
