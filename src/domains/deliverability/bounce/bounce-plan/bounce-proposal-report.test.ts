import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceProposalReport } from "./bounce-proposal-report.js";
import { BounceProposal, newBounceProposal } from "./bounce-proposal.js";

test("BounceProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_543_702);
  const items: BounceProposal[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBounceProposal(`bounce-proposal-${index}`, "sample"));
  }
  const report = buildBounceProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
