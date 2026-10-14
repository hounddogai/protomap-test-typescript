import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRetentionSegment } from "./batched-retention-segment.js";

test("BatchedRetentionSegment starts in created", () => {
  const item = newBatchedRetentionSegment("code-350", "name-429");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRetentionSegment moves to published", () => {
  const item = newBatchedRetentionSegment("code-350", "name-429");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedRetentionSegment rejects moves from retired", () => {
  const item = newBatchedRetentionSegment("code-350", "name-429");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
