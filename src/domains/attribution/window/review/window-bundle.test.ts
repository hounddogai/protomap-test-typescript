import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowBundle } from "./window-bundle.js";

test("WindowBundle starts in idle", () => {
  const item = newWindowBundle("code-805", "name-702");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowBundle moves to warming", () => {
  const item = newWindowBundle("code-805", "name-702");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WindowBundle rejects moves from stopped", () => {
  const item = newWindowBundle("code-805", "name-702");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
