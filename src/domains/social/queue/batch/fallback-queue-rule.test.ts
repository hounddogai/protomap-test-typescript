import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackQueueRule } from "./fallback-queue-rule.js";

test("FallbackQueueRule starts in idle", () => {
  const item = newFallbackQueueRule("code-28", "name-223");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackQueueRule moves to draining", () => {
  const item = newFallbackQueueRule("code-28", "name-223");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FallbackQueueRule rejects moves from stopped", () => {
  const item = newFallbackQueueRule("code-28", "name-223");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
