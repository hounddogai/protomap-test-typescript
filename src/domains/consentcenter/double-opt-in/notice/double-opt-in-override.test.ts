import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInOverride } from "./double-opt-in-override.js";

test("DoubleOptInOverride starts in idle", () => {
  const item = newDoubleOptInOverride("code-132", "name-307");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInOverride moves to stopped", () => {
  const item = newDoubleOptInOverride("code-132", "name-307");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("DoubleOptInOverride rejects moves from stopped", () => {
  const item = newDoubleOptInOverride("code-132", "name-307");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
