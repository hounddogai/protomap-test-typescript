import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyTier } from "./reply-tier.js";

test("ReplyTier starts in idle", () => {
  const item = newReplyTier("code-574", "title-696");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyTier moves to warming", () => {
  const item = newReplyTier("code-574", "title-696");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ReplyTier rejects moves from stopped", () => {
  const item = newReplyTier("code-574", "title-696");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
