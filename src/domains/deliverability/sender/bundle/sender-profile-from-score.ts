import { LenientReputationScore } from "../../reputation/reputation-digest/lenient-reputation-score.js";
import { normalizeReputationGroupCode } from "../../reputation/reputation-digest/reputation-group-policy.js";
import { SenderProfile, newSenderProfile } from "./sender-profile.js";

export function summarizeLenientReputationScoresForProfile(items: LenientReputationScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSenderProfilesFromScore(items: LenientReputationScore[]): SenderProfile[] {
  const out: SenderProfile[] = [];
  for (const item of items) {
    const derived = newSenderProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSenderProfile(item: SenderProfile): string {
  return normalizeReputationGroupCode(item.code);
}
