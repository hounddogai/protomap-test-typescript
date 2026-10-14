import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInviteReservation } from "./primary-invite-reservation.js";

test("PrimaryInviteReservation starts in open", () => {
  const item = newPrimaryInviteReservation("code-451", "name-783");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInviteReservation moves to archived", () => {
  const item = newPrimaryInviteReservation("code-451", "name-783");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PrimaryInviteReservation rejects moves from archived", () => {
  const item = newPrimaryInviteReservation("code-451", "name-783");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
