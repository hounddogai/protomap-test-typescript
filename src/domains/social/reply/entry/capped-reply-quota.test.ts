import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedReplyQuota } from "./capped-reply-quota.js";

test("CappedReplyQuota starts in idle", () => {
  const item = newCappedReplyQuota("code-960", "label-874");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedReplyQuota moves to ready", () => {
  const item = newCappedReplyQuota("code-960", "label-874");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CappedReplyQuota rejects moves from stopped", () => {
  const item = newCappedReplyQuota("code-960", "label-874");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
