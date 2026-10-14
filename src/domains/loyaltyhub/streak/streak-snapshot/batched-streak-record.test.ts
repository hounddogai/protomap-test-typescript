import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedStreakRecord } from "./batched-streak-record.js";

test("BatchedStreakRecord starts in draft", () => {
  const item = newBatchedStreakRecord("code-856", "title-185");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedStreakRecord moves to pending", () => {
  const item = newBatchedStreakRecord("code-856", "title-185");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedStreakRecord rejects moves from closed", () => {
  const item = newBatchedStreakRecord("code-856", "title-185");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
