import { GlobalWindowAudit } from "../../window/audit/global-window-audit.js";
import { normalizeWindowAssignmentCode } from "../../window/audit/window-assignment-policy.js";
import { ConversionRequest, newConversionRequest } from "./conversion-request.js";

export function summarizeGlobalWindowAuditsForRequest(items: GlobalWindowAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveConversionRequestsFromAudit(items: GlobalWindowAudit[]): ConversionRequest[] {
  const out: ConversionRequest[] = [];
  for (const item of items) {
    const derived = newConversionRequest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeConversionRequest(item: ConversionRequest): string {
  return normalizeWindowAssignmentCode(item.code);
}
