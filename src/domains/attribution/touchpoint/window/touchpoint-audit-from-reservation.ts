import { windowAgreementBucket } from "../../window/manifest/window-agreement-policy.js";
import { WindowReservation } from "../../window/manifest/window-reservation.js";
import { TouchpointAudit, newTouchpointAudit } from "./touchpoint-audit.js";

export function summarizeWindowReservationsForAudit(items: WindowReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveTouchpointAuditsFromReservation(items: WindowReservation[]): TouchpointAudit[] {
  const out: TouchpointAudit[] = [];
  for (const item of items) {
    const derived = newTouchpointAudit(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyTouchpointAuditExtra(item: TouchpointAudit): string {
  return windowAgreementBucket(item.netVolume());
}
