import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

test("ScheduledConversionReservation starts in requested", () => {
  const item = newScheduledConversionReservation("code-326", "label-21");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledConversionReservation moves to revoked", () => {
  const item = newScheduledConversionReservation("code-326", "label-21");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ScheduledConversionReservation rejects moves from expired", () => {
  const item = newScheduledConversionReservation("code-326", "label-21");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
