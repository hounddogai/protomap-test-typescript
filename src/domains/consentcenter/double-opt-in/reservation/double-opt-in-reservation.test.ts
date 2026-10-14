import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInReservation } from "./double-opt-in-reservation.js";

test("DoubleOptInReservation starts in open", () => {
  const item = newDoubleOptInReservation("code-607", "name-403");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInReservation moves to resolved", () => {
  const item = newDoubleOptInReservation("code-607", "name-403");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DoubleOptInReservation rejects moves from archived", () => {
  const item = newDoubleOptInReservation("code-607", "name-403");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
