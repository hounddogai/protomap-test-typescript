import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedOptOutScore } from "./batched-opt-out-score.js";

test("BatchedOptOutScore starts in new", () => {
  const item = newBatchedOptOutScore("code-640", "title-264");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedOptOutScore moves to queued", () => {
  const item = newBatchedOptOutScore("code-640", "title-264");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedOptOutScore rejects moves from failed", () => {
  const item = newBatchedOptOutScore("code-640", "title-264");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
