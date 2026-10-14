import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRetentionWindow } from "./global-retention-window.js";

test("GlobalRetentionWindow starts in idle", () => {
  const item = newGlobalRetentionWindow("code-673", "label-129");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRetentionWindow moves to stopped", () => {
  const item = newGlobalRetentionWindow("code-673", "label-129");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("GlobalRetentionWindow rejects moves from stopped", () => {
  const item = newGlobalRetentionWindow("code-673", "label-129");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
