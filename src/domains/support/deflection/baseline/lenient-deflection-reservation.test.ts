import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionReservation } from "./lenient-deflection-reservation.js";

test("LenientDeflectionReservation starts in draft", () => {
  const item = newLenientDeflectionReservation("code-427", "label-967");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionReservation moves to active", () => {
  const item = newLenientDeflectionReservation("code-427", "label-967");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientDeflectionReservation rejects moves from closed", () => {
  const item = newLenientDeflectionReservation("code-427", "label-967");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
