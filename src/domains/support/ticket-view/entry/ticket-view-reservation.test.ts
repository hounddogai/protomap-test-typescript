import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewReservation } from "./ticket-view-reservation.js";

test("TicketViewReservation starts in proposed", () => {
  const item = newTicketViewReservation("code-471", "label-413");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewReservation moves to approved", () => {
  const item = newTicketViewReservation("code-471", "label-413");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TicketViewReservation rejects moves from withdrawn", () => {
  const item = newTicketViewReservation("code-471", "label-413");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
