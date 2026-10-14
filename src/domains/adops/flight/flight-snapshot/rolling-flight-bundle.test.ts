import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFlightBundle } from "./rolling-flight-bundle.js";

test("RollingFlightBundle starts in idle", () => {
  const item = newRollingFlightBundle("code-216", "name-782");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFlightBundle moves to warming", () => {
  const item = newRollingFlightBundle("code-216", "name-782");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingFlightBundle rejects moves from stopped", () => {
  const item = newRollingFlightBundle("code-216", "name-782");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
