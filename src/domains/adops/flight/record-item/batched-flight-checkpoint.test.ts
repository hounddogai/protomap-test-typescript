import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

test("BatchedFlightCheckpoint starts in draft", () => {
  const item = newBatchedFlightCheckpoint("code-98", "title-749");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFlightCheckpoint moves to pending", () => {
  const item = newBatchedFlightCheckpoint("code-98", "title-749");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedFlightCheckpoint rejects moves from closed", () => {
  const item = newBatchedFlightCheckpoint("code-98", "title-749");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
