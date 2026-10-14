import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredMentionTier } from "./tiered-mention-tier.js";

test("TieredMentionTier starts in idle", () => {
  const item = newTieredMentionTier("code-289", "title-12");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredMentionTier moves to ready", () => {
  const item = newTieredMentionTier("code-289", "title-12");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredMentionTier rejects moves from stopped", () => {
  const item = newTieredMentionTier("code-289", "title-12");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
