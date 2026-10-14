import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionReservation } from "./suppression-reservation.js";

test("SuppressionReservation starts in idle", () => {
  const item = newSuppressionReservation("code-86", "label-211");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionReservation moves to ready", () => {
  const item = newSuppressionReservation("code-86", "label-211");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SuppressionReservation rejects moves from stopped", () => {
  const item = newSuppressionReservation("code-86", "label-211");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
