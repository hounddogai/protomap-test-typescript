import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTouchpointVariance } from "./batched-touchpoint-variance.js";

test("BatchedTouchpointVariance starts in new", () => {
  const item = newBatchedTouchpointVariance("code-135", "title-589");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTouchpointVariance moves to running", () => {
  const item = newBatchedTouchpointVariance("code-135", "title-589");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedTouchpointVariance rejects moves from failed", () => {
  const item = newBatchedTouchpointVariance("code-135", "title-589");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
