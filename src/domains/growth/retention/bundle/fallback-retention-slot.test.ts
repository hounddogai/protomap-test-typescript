import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRetentionSlot } from "./fallback-retention-slot.js";

test("FallbackRetentionSlot starts in idle", () => {
  const item = newFallbackRetentionSlot("code-662", "name-118");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRetentionSlot moves to warming", () => {
  const item = newFallbackRetentionSlot("code-662", "name-118");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackRetentionSlot rejects moves from stopped", () => {
  const item = newFallbackRetentionSlot("code-662", "name-118");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
