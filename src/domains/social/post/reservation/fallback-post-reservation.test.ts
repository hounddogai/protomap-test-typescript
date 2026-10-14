import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPostReservation } from "./fallback-post-reservation.js";

test("FallbackPostReservation starts in idle", () => {
  const item = newFallbackPostReservation("code-50", "label-984");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPostReservation moves to stopped", () => {
  const item = newFallbackPostReservation("code-50", "label-984");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("FallbackPostReservation rejects moves from stopped", () => {
  const item = newFallbackPostReservation("code-50", "label-984");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
