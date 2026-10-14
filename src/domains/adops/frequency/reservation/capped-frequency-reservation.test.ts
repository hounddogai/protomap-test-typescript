import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFrequencyReservation } from "./capped-frequency-reservation.js";

test("CappedFrequencyReservation starts in open", () => {
  const item = newCappedFrequencyReservation("code-152", "title-446");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFrequencyReservation moves to resolved", () => {
  const item = newCappedFrequencyReservation("code-152", "title-446");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedFrequencyReservation rejects moves from archived", () => {
  const item = newCappedFrequencyReservation("code-152", "title-446");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
