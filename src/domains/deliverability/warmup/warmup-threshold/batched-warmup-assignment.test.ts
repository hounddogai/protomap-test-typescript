import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWarmupAssignment } from "./batched-warmup-assignment.js";

test("BatchedWarmupAssignment starts in proposed", () => {
  const item = newBatchedWarmupAssignment("code-14", "label-1");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWarmupAssignment moves to approved", () => {
  const item = newBatchedWarmupAssignment("code-14", "label-1");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedWarmupAssignment rejects moves from withdrawn", () => {
  const item = newBatchedWarmupAssignment("code-14", "label-1");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
