import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFlightScore } from "./rolling-flight-score.js";

test("RollingFlightScore starts in idle", () => {
  const item = newRollingFlightScore("code-326", "label-42");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFlightScore moves to draining", () => {
  const item = newRollingFlightScore("code-326", "label-42");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RollingFlightScore rejects moves from stopped", () => {
  const item = newRollingFlightScore("code-326", "label-42");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
