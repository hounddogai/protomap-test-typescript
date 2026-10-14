import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

test("StrictFlightCheckpoint starts in planned", () => {
  const item = newStrictFlightCheckpoint("code-710", "name-715");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFlightCheckpoint moves to completed", () => {
  const item = newStrictFlightCheckpoint("code-710", "name-715");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("StrictFlightCheckpoint rejects moves from cancelled", () => {
  const item = newStrictFlightCheckpoint("code-710", "name-715");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
