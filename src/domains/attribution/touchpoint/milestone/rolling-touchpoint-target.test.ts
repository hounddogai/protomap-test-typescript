import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingTouchpointTarget } from "./rolling-touchpoint-target.js";

test("RollingTouchpointTarget starts in idle", () => {
  const item = newRollingTouchpointTarget("code-608", "name-84");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingTouchpointTarget moves to ready", () => {
  const item = newRollingTouchpointTarget("code-608", "name-84");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RollingTouchpointTarget rejects moves from stopped", () => {
  const item = newRollingTouchpointTarget("code-608", "name-84");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
