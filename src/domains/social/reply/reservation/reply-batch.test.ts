import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyBatch } from "./reply-batch.js";

test("ReplyBatch starts in planned", () => {
  const item = newReplyBatch("code-32", "label-970");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyBatch moves to in progress", () => {
  const item = newReplyBatch("code-32", "label-970");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ReplyBatch rejects moves from cancelled", () => {
  const item = newReplyBatch("code-32", "label-970");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
