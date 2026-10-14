import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPacingProposalReport } from "./batched-pacing-proposal-report.js";
import { BatchedPacingProposal, newBatchedPacingProposal } from "./batched-pacing-proposal.js";

test("BatchedPacingProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_348_362);
  const items: BatchedPacingProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedPacingProposal(`batched-pacing-proposal-${index}`, "sample"));
  }
  const report = buildBatchedPacingProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
