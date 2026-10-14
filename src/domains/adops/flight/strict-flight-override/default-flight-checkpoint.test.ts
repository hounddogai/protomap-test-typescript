import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

test("DefaultFlightCheckpoint starts in idle", () => {
  const item = newDefaultFlightCheckpoint("code-250", "title-61");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFlightCheckpoint moves to draining", () => {
  const item = newDefaultFlightCheckpoint("code-250", "title-61");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("DefaultFlightCheckpoint rejects moves from stopped", () => {
  const item = newDefaultFlightCheckpoint("code-250", "title-61");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
