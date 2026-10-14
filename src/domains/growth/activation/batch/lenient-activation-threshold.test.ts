import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientActivationThreshold } from "./lenient-activation-threshold.js";

test("LenientActivationThreshold starts in idle", () => {
  const item = newLenientActivationThreshold("code-844", "name-150");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientActivationThreshold moves to ready", () => {
  const item = newLenientActivationThreshold("code-844", "name-150");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientActivationThreshold rejects moves from stopped", () => {
  const item = newLenientActivationThreshold("code-844", "name-150");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
