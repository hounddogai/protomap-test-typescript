import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyActivationException } from "./legacy-activation-exception.js";

test("LegacyActivationException starts in idle", () => {
  const item = newLegacyActivationException("code-95", "name-661");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyActivationException moves to stopped", () => {
  const item = newLegacyActivationException("code-95", "name-661");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("LegacyActivationException rejects moves from stopped", () => {
  const item = newLegacyActivationException("code-95", "name-661");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
