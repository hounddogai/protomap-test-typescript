import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

test("PendingFlightCheckpoint starts in idle", () => {
  const item = newPendingFlightCheckpoint("code-209", "title-464");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFlightCheckpoint moves to warming", () => {
  const item = newPendingFlightCheckpoint("code-209", "title-464");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingFlightCheckpoint rejects moves from stopped", () => {
  const item = newPendingFlightCheckpoint("code-209", "title-464");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
