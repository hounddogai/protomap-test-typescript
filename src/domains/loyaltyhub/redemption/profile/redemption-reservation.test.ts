import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionReservation } from "./redemption-reservation.js";

test("RedemptionReservation starts in idle", () => {
  const item = newRedemptionReservation("code-659", "title-300");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionReservation moves to ready", () => {
  const item = newRedemptionReservation("code-659", "title-300");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RedemptionReservation rejects moves from stopped", () => {
  const item = newRedemptionReservation("code-659", "title-300");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
