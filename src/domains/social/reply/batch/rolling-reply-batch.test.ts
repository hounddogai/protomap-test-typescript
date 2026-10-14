import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingReplyBatch } from "./rolling-reply-batch.js";

test("RollingReplyBatch starts in draft", () => {
  const item = newRollingReplyBatch("code-510", "label-129");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingReplyBatch moves to active", () => {
  const item = newRollingReplyBatch("code-510", "label-129");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RollingReplyBatch rejects moves from closed", () => {
  const item = newRollingReplyBatch("code-510", "label-129");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
