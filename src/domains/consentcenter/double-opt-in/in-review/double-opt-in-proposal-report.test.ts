import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInProposalReport } from "./double-opt-in-proposal-report.js";
import { DoubleOptInProposal, newDoubleOptInProposal } from "./double-opt-in-proposal.js";

test("DoubleOptInProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_743_695);
  const items: DoubleOptInProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDoubleOptInProposal(`double-opt-in-proposal-${index}`, "sample"));
  }
  const report = buildDoubleOptInProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
