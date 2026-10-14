import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPostQuota } from "./batched-post-quota.js";

test("BatchedPostQuota starts in planned", () => {
  const item = newBatchedPostQuota("code-13", "name-169");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPostQuota moves to scheduled", () => {
  const item = newBatchedPostQuota("code-13", "name-169");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedPostQuota rejects moves from cancelled", () => {
  const item = newBatchedPostQuota("code-13", "name-169");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
