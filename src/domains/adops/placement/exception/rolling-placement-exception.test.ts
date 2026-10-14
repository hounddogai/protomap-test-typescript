import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPlacementException } from "./rolling-placement-exception.js";

test("RollingPlacementException starts in idle", () => {
  const item = newRollingPlacementException("code-317", "name-447");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPlacementException moves to ready", () => {
  const item = newRollingPlacementException("code-317", "name-447");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RollingPlacementException rejects moves from stopped", () => {
  const item = newRollingPlacementException("code-317", "name-447");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
