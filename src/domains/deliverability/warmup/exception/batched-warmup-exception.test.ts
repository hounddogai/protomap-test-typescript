import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWarmupException } from "./batched-warmup-exception.js";

test("BatchedWarmupException starts in draft", () => {
  const item = newBatchedWarmupException("code-115", "name-13");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWarmupException moves to pending", () => {
  const item = newBatchedWarmupException("code-115", "name-13");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedWarmupException rejects moves from closed", () => {
  const item = newBatchedWarmupException("code-115", "name-13");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
