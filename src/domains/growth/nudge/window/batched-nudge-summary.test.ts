import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedNudgeSummary } from "./batched-nudge-summary.js";

test("BatchedNudgeSummary starts in new", () => {
  const item = newBatchedNudgeSummary("code-513", "label-522");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedNudgeSummary moves to queued", () => {
  const item = newBatchedNudgeSummary("code-513", "label-522");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedNudgeSummary rejects moves from failed", () => {
  const item = newBatchedNudgeSummary("code-513", "label-522");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
