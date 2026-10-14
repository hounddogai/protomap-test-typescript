import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

test("RollingTouchpointTemplate starts in idle", () => {
  const item = newRollingTouchpointTemplate("code-538", "title-44");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingTouchpointTemplate moves to warming", () => {
  const item = newRollingTouchpointTemplate("code-538", "title-44");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingTouchpointTemplate rejects moves from stopped", () => {
  const item = newRollingTouchpointTemplate("code-538", "title-44");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
