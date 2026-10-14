import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFlightReservation } from "./legacy-flight-reservation.js";

test("LegacyFlightReservation starts in idle", () => {
  const item = newLegacyFlightReservation("code-643", "label-102");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFlightReservation moves to warming", () => {
  const item = newLegacyFlightReservation("code-643", "label-102");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyFlightReservation rejects moves from stopped", () => {
  const item = newLegacyFlightReservation("code-643", "label-102");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
