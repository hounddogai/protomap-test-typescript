import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReputationReservation } from "./fallback-reputation-reservation.js";

test("FallbackReputationReservation starts in idle", () => {
  const item = newFallbackReputationReservation("code-709", "title-154");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReputationReservation moves to ready", () => {
  const item = newFallbackReputationReservation("code-709", "title-154");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackReputationReservation rejects moves from stopped", () => {
  const item = newFallbackReputationReservation("code-709", "title-154");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
