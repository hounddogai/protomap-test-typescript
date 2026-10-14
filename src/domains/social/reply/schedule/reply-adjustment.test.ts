import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyAdjustment } from "./reply-adjustment.js";

test("ReplyAdjustment starts in idle", () => {
  const item = newReplyAdjustment("code-354", "name-242");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyAdjustment moves to draining", () => {
  const item = newReplyAdjustment("code-354", "name-242");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ReplyAdjustment rejects moves from stopped", () => {
  const item = newReplyAdjustment("code-354", "name-242");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
