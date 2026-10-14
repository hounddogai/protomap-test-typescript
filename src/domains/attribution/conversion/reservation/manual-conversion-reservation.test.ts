import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualConversionReservation } from "./manual-conversion-reservation.js";

test("ManualConversionReservation starts in requested", () => {
  const item = newManualConversionReservation("code-815", "name-666");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualConversionReservation moves to revoked", () => {
  const item = newManualConversionReservation("code-815", "name-666");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualConversionReservation rejects moves from expired", () => {
  const item = newManualConversionReservation("code-815", "name-666");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
