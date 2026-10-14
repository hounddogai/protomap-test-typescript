import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPathCycle } from "./batched-path-cycle.js";

test("BatchedPathCycle starts in new", () => {
  const item = newBatchedPathCycle("code-308", "label-204");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPathCycle moves to running", () => {
  const item = newBatchedPathCycle("code-308", "label-204");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedPathCycle rejects moves from failed", () => {
  const item = newBatchedPathCycle("code-308", "label-204");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
