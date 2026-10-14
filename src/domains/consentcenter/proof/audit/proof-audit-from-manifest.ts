import { normalizeLenientProofTargetCode } from "../policy/lenient-proof-target-policy.js";
import { ProofManifest } from "../policy/proof-manifest.js";
import { ProofAudit, newProofAudit } from "./proof-audit.js";

export function summarizeProofManifestsForAudit(items: ProofManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveProofAuditsFromManifest(items: ProofManifest[]): ProofAudit[] {
  const out: ProofAudit[] = [];
  for (const item of items) {
    const derived = newProofAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectProofAudit(item: ProofAudit): string {
  return normalizeLenientProofTargetCode(item.code);
}
