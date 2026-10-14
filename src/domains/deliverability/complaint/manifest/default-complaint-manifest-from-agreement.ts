import { classifySeasonalComplaintAgreement } from "../draft/seasonal-complaint-agreement-policy.js";
import { SeasonalComplaintAgreement } from "../draft/seasonal-complaint-agreement.js";
import { DefaultComplaintManifest, newDefaultComplaintManifest } from "./default-complaint-manifest.js";

export function summarizeSeasonalComplaintAgreementsForManifest(items: SeasonalComplaintAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveDefaultComplaintManifestsFromAgreement(items: SeasonalComplaintAgreement[]): DefaultComplaintManifest[] {
  const out: DefaultComplaintManifest[] = [];
  for (const item of items) {
    const derived = newDefaultComplaintManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitDefaultComplaintManifest(item: DefaultComplaintManifest): string {
  return classifySeasonalComplaintAgreement(item.netVolume());
}
