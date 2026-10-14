import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedModelGroup } from "./batched-model-group.js";

test("BatchedModelGroup starts in created", () => {
  const item = newBatchedModelGroup("code-78", "label-977");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedModelGroup moves to retired", () => {
  const item = newBatchedModelGroup("code-78", "label-977");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("BatchedModelGroup rejects moves from retired", () => {
  const item = newBatchedModelGroup("code-78", "label-977");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
