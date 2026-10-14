import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionReservation } from "./conversion-reservation.js";

test("ConversionReservation starts in requested", () => {
  const item = newConversionReservation("code-344", "name-620");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionReservation moves to granted", () => {
  const item = newConversionReservation("code-344", "name-620");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ConversionReservation rejects moves from expired", () => {
  const item = newConversionReservation("code-344", "name-620");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
