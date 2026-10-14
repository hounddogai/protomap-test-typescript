import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictStepProposalReport } from "./strict-step-proposal-report.js";
import { StrictStepProposal, newStrictStepProposal } from "./strict-step-proposal.js";

test("StrictStepProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_557_865);
  const items: StrictStepProposal[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictStepProposal(`strict-step-proposal-${index}`, "sample"));
  }
  const report = buildStrictStepProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
