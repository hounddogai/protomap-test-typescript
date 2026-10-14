import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackTierNotice } from "./fallback-tier-notice.js";

test("FallbackTierNotice starts in idle", () => {
  const item = newFallbackTierNotice("code-431", "title-898");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackTierNotice moves to stopped", () => {
  const item = newFallbackTierNotice("code-431", "title-898");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("FallbackTierNotice rejects moves from stopped", () => {
  const item = newFallbackTierNotice("code-431", "title-898");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
