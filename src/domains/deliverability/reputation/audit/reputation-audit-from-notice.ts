import { normalizeComplaintNoticeCode } from "../../complaint/claim/complaint-notice-policy.js";
import { RollingComplaintNotice } from "../../complaint/claim/rolling-complaint-notice.js";
import { ReputationAudit, newReputationAudit } from "./reputation-audit.js";

export function summarizeRollingComplaintNoticesForAudit(items: RollingComplaintNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveReputationAuditsFromNotice(items: RollingComplaintNotice[]): ReputationAudit[] {
  const out: ReputationAudit[] = [];
  for (const item of items) {
    const derived = newReputationAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreReputationAudit(item: ReputationAudit): string {
  return normalizeComplaintNoticeCode(item.code);
}
