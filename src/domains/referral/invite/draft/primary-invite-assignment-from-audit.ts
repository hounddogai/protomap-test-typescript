import {
  normalizeBatchedFraudCheckReservationCode,
} from "../../fraud-check/check-draft/batched-fraud-check-reservation-policy.js";
import { SeasonalFraudCheckAudit } from "../../fraud-check/check-draft/seasonal-fraud-check-audit.js";
import { PrimaryInviteAssignment, newPrimaryInviteAssignment } from "./primary-invite-assignment.js";

export function summarizeSeasonalFraudCheckAuditsForAssignment(items: SeasonalFraudCheckAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePrimaryInviteAssignmentsFromAudit(items: SeasonalFraudCheckAudit[]): PrimaryInviteAssignment[] {
  const out: PrimaryInviteAssignment[] = [];
  for (const item of items) {
    const derived = newPrimaryInviteAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimatePrimaryInviteAssignment(item: PrimaryInviteAssignment): string {
  return normalizeBatchedFraudCheckReservationCode(item.code);
}
