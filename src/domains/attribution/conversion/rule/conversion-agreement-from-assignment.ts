import {
  normalizeLegacyTouchpointTemplateCode,
} from "../../touchpoint/template/legacy-touchpoint-template-policy.js";
import { PrimaryTouchpointAssignment } from "../../touchpoint/template/primary-touchpoint-assignment.js";
import { ConversionAgreement, newConversionAgreement } from "./conversion-agreement.js";

export function summarizePrimaryTouchpointAssignmentsForAgreement(items: PrimaryTouchpointAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveConversionAgreementsFromAssignment(items: PrimaryTouchpointAssignment[]): ConversionAgreement[] {
  const out: ConversionAgreement[] = [];
  for (const item of items) {
    const derived = newConversionAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyConversionAgreement(item: ConversionAgreement): string {
  return normalizeLegacyTouchpointTemplateCode(item.code);
}
