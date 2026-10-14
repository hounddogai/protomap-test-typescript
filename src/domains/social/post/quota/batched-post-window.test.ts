import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPostWindow } from "./batched-post-window.js";

test("BatchedPostWindow starts in planned", () => {
  const item = newBatchedPostWindow("code-316", "label-114");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPostWindow moves to scheduled", () => {
  const item = newBatchedPostWindow("code-316", "label-114");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedPostWindow rejects moves from cancelled", () => {
  const item = newBatchedPostWindow("code-316", "label-114");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
