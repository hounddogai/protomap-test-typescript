import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedStepAdjustment } from "./batched-step-adjustment.js";

test("BatchedStepAdjustment starts in draft", () => {
  const item = newBatchedStepAdjustment("code-578", "name-491");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedStepAdjustment moves to pending", () => {
  const item = newBatchedStepAdjustment("code-578", "name-491");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedStepAdjustment rejects moves from closed", () => {
  const item = newBatchedStepAdjustment("code-578", "name-491");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
