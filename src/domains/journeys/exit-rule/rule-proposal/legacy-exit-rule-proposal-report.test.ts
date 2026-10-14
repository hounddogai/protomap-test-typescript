import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyExitRuleProposalReport } from "./legacy-exit-rule-proposal-report.js";
import { LegacyExitRuleProposal, newLegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

test("LegacyExitRuleProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_945_733);
  const items: LegacyExitRuleProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyExitRuleProposal(`legacy-exit-rule-proposal-${index}`, "sample"));
  }
  const report = buildLegacyExitRuleProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
