import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledRedemptionReservation } from "./scheduled-redemption-reservation.js";

test("ScheduledRedemptionReservation starts in idle", () => {
  const item = newScheduledRedemptionReservation("code-840", "name-306");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledRedemptionReservation moves to ready", () => {
  const item = newScheduledRedemptionReservation("code-840", "name-306");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ScheduledRedemptionReservation rejects moves from stopped", () => {
  const item = newScheduledRedemptionReservation("code-840", "name-306");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
