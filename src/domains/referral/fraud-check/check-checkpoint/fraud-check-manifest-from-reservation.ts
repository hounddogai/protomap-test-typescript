import { normalizeManualInviteTemplateCode } from "../../invite/invite-reservation/manual-invite-template-policy.js";
import { PrimaryInviteReservation } from "../../invite/invite-reservation/primary-invite-reservation.js";
import { FraudCheckManifest, newFraudCheckManifest } from "./fraud-check-manifest.js";

export function summarizePrimaryInviteReservationsForManifest(items: PrimaryInviteReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFraudCheckManifestsFromReservation(items: PrimaryInviteReservation[]): FraudCheckManifest[] {
  const out: FraudCheckManifest[] = [];
  for (const item of items) {
    const derived = newFraudCheckManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyFraudCheckManifest(item: FraudCheckManifest): string {
  return normalizeManualInviteTemplateCode(item.code);
}
