import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPostException } from "./batched-post-exception.js";

test("BatchedPostException starts in open", () => {
  const item = newBatchedPostException("code-231", "title-192");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPostException moves to in review", () => {
  const item = newBatchedPostException("code-231", "title-192");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedPostException rejects moves from archived", () => {
  const item = newBatchedPostException("code-231", "title-192");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
