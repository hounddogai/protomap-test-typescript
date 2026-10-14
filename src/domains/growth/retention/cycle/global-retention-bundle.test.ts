import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRetentionBundle } from "./global-retention-bundle.js";

test("GlobalRetentionBundle starts in idle", () => {
  const item = newGlobalRetentionBundle("code-807", "name-185");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRetentionBundle moves to warming", () => {
  const item = newGlobalRetentionBundle("code-807", "name-185");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalRetentionBundle rejects moves from stopped", () => {
  const item = newGlobalRetentionBundle("code-807", "name-185");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
