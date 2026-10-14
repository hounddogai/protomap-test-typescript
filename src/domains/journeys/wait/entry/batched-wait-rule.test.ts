import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWaitRule } from "./batched-wait-rule.js";

test("BatchedWaitRule starts in new", () => {
  const item = newBatchedWaitRule("code-137", "title-587");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWaitRule moves to running", () => {
  const item = newBatchedWaitRule("code-137", "title-587");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedWaitRule rejects moves from failed", () => {
  const item = newBatchedWaitRule("code-137", "title-587");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
