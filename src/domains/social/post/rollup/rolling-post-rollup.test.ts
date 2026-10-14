import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPostRollup } from "./rolling-post-rollup.js";

test("RollingPostRollup starts in idle", () => {
  const item = newRollingPostRollup("code-544", "label-844");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPostRollup moves to warming", () => {
  const item = newRollingPostRollup("code-544", "label-844");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingPostRollup rejects moves from stopped", () => {
  const item = newRollingPostRollup("code-544", "label-844");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
