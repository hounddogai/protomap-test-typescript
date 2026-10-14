import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedLevelRequest } from "./batched-level-request.js";

test("BatchedLevelRequest starts in idle", () => {
  const item = newBatchedLevelRequest("code-977", "title-517");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedLevelRequest moves to draining", () => {
  const item = newBatchedLevelRequest("code-977", "title-517");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedLevelRequest rejects moves from stopped", () => {
  const item = newBatchedLevelRequest("code-977", "title-517");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
