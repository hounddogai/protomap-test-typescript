import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingOptOutTemplate } from "./pending-opt-out-template.js";

test("PendingOptOutTemplate starts in idle", () => {
  const item = newPendingOptOutTemplate("code-58", "name-335");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingOptOutTemplate moves to draining", () => {
  const item = newPendingOptOutTemplate("code-58", "name-335");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PendingOptOutTemplate rejects moves from stopped", () => {
  const item = newPendingOptOutTemplate("code-58", "name-335");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
