import { normalizeFraudCheckTemplateCode } from "../../fraud-check/draft/fraud-check-template-policy.js";
import { FraudCheckTemplate } from "../../fraud-check/draft/fraud-check-template.js";
import { PayoutAudit, newPayoutAudit } from "./payout-audit.js";

export function summarizeFraudCheckTemplatesForAudit(items: FraudCheckTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePayoutAuditsFromTemplate(items: FraudCheckTemplate[]): PayoutAudit[] {
  const out: PayoutAudit[] = [];
  for (const item of items) {
    const derived = newPayoutAudit(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePayoutAudit(item: PayoutAudit): string {
  return normalizeFraudCheckTemplateCode(item.code);
}
