import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWindowTarget } from "./rolling-window-target.js";

test("RollingWindowTarget starts in idle", () => {
  const item = newRollingWindowTarget("code-993", "title-807");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWindowTarget moves to warming", () => {
  const item = newRollingWindowTarget("code-993", "title-807");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingWindowTarget rejects moves from stopped", () => {
  const item = newRollingWindowTarget("code-993", "title-807");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
