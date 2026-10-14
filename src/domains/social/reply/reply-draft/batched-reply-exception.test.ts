import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedReplyException } from "./batched-reply-exception.js";

test("BatchedReplyException starts in proposed", () => {
  const item = newBatchedReplyException("code-623", "name-396");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedReplyException moves to rejected", () => {
  const item = newBatchedReplyException("code-623", "name-396");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BatchedReplyException rejects moves from withdrawn", () => {
  const item = newBatchedReplyException("code-623", "name-396");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
