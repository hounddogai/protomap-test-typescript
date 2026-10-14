import { WindowAgreement } from "../../window/manifest/window-agreement.js";
import { normalizeWindowManifestCode } from "../../window/manifest/window-manifest-policy.js";
import { ModelScore, newModelScore } from "./model-score.js";

export function summarizeWindowAgreementsForScore(items: WindowAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveModelScoresFromAgreement(items: WindowAgreement[]): ModelScore[] {
  const out: ModelScore[] = [];
  for (const item of items) {
    const derived = newModelScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planModelScore(item: ModelScore): string {
  return normalizeWindowManifestCode(item.code);
}
