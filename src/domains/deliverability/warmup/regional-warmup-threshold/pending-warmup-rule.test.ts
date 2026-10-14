import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingWarmupRule } from "./pending-warmup-rule.js";

test("PendingWarmupRule starts in idle", () => {
  const item = newPendingWarmupRule("code-95", "name-407");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingWarmupRule moves to warming", () => {
  const item = newPendingWarmupRule("code-95", "name-407");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingWarmupRule rejects moves from stopped", () => {
  const item = newPendingWarmupRule("code-95", "name-407");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
