import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyMacroProposalReport } from "./legacy-macro-proposal-report.js";
import { LegacyMacroProposal, newLegacyMacroProposal } from "./legacy-macro-proposal.js";

test("LegacyMacroProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_873_901);
  const items: LegacyMacroProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyMacroProposal(`legacy-macro-proposal-${index}`, "sample"));
  }
  const report = buildLegacyMacroProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
