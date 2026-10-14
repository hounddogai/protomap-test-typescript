import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedNudgeVariance } from "./batched-nudge-variance.js";

test("BatchedNudgeVariance starts in planned", () => {
  const item = newBatchedNudgeVariance("code-649", "label-628");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedNudgeVariance moves to completed", () => {
  const item = newBatchedNudgeVariance("code-649", "label-628");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("BatchedNudgeVariance rejects moves from cancelled", () => {
  const item = newBatchedNudgeVariance("code-649", "label-628");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
