import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFrequencyClaim } from "./rolling-frequency-claim.js";

test("RollingFrequencyClaim starts in idle", () => {
  const item = newRollingFrequencyClaim("code-935", "name-694");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFrequencyClaim moves to stopped", () => {
  const item = newRollingFrequencyClaim("code-935", "name-694");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RollingFrequencyClaim rejects moves from stopped", () => {
  const item = newRollingFrequencyClaim("code-935", "name-694");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
