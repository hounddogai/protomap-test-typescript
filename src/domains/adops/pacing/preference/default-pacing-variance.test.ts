import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPacingVariance } from "./default-pacing-variance.js";

test("DefaultPacingVariance starts in idle", () => {
  const item = newDefaultPacingVariance("code-919", "name-198");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPacingVariance moves to stopped", () => {
  const item = newDefaultPacingVariance("code-919", "name-198");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("DefaultPacingVariance rejects moves from stopped", () => {
  const item = newDefaultPacingVariance("code-919", "name-198");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
