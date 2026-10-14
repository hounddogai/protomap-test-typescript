import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyReservation } from "./journey-reservation.js";

test("JourneyReservation starts in open", () => {
  const item = newJourneyReservation("code-599", "label-777");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyReservation moves to archived", () => {
  const item = newJourneyReservation("code-599", "label-777");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("JourneyReservation rejects moves from archived", () => {
  const item = newJourneyReservation("code-599", "label-777");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
