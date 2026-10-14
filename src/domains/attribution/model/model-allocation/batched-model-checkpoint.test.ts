import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedModelCheckpoint } from "./batched-model-checkpoint.js";

test("BatchedModelCheckpoint starts in draft", () => {
  const item = newBatchedModelCheckpoint("code-193", "name-940");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedModelCheckpoint moves to suspended", () => {
  const item = newBatchedModelCheckpoint("code-193", "name-940");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BatchedModelCheckpoint rejects moves from closed", () => {
  const item = newBatchedModelCheckpoint("code-193", "name-940");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
