import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryExitRuleProposalReport } from "./primary-exit-rule-proposal-report.js";
import { PrimaryExitRuleProposal, newPrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

test("PrimaryExitRuleProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_633_196);
  const items: PrimaryExitRuleProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryExitRuleProposal(`primary-exit-rule-proposal-${index}`, "sample"));
  }
  const report = buildPrimaryExitRuleProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
