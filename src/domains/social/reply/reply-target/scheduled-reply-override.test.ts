import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledReplyOverride } from "./scheduled-reply-override.js";

test("ScheduledReplyOverride starts in idle", () => {
  const item = newScheduledReplyOverride("code-852", "label-626");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledReplyOverride moves to ready", () => {
  const item = newScheduledReplyOverride("code-852", "label-626");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ScheduledReplyOverride rejects moves from stopped", () => {
  const item = newScheduledReplyOverride("code-852", "label-626");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
