import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedOptOutBaseline } from "./batched-opt-out-baseline.js";

test("BatchedOptOutBaseline starts in new", () => {
  const item = newBatchedOptOutBaseline("code-73", "title-706");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedOptOutBaseline moves to failed", () => {
  const item = newBatchedOptOutBaseline("code-73", "title-706");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BatchedOptOutBaseline rejects moves from failed", () => {
  const item = newBatchedOptOutBaseline("code-73", "title-706");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
