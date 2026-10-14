import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedQueueProposalReport } from "./batched-queue-proposal-report.js";
import { BatchedQueueProposal, newBatchedQueueProposal } from "./batched-queue-proposal.js";

test("BatchedQueueProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_775_269);
  const items: BatchedQueueProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedQueueProposal(`batched-queue-proposal-${index}`, "sample"));
  }
  const report = buildBatchedQueueProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
