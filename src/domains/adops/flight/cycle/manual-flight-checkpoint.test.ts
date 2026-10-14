import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

test("ManualFlightCheckpoint starts in idle", () => {
  const item = newManualFlightCheckpoint("code-857", "title-567");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFlightCheckpoint moves to ready", () => {
  const item = newManualFlightCheckpoint("code-857", "title-567");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualFlightCheckpoint rejects moves from stopped", () => {
  const item = newManualFlightCheckpoint("code-857", "title-567");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
