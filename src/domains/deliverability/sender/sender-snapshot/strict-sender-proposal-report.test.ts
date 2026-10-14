import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictSenderProposalReport } from "./strict-sender-proposal-report.js";
import { StrictSenderProposal, newStrictSenderProposal } from "./strict-sender-proposal.js";

test("StrictSenderProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_301_175);
  const items: StrictSenderProposal[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictSenderProposal(`strict-sender-proposal-${index}`, "sample"));
  }
  const report = buildStrictSenderProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
