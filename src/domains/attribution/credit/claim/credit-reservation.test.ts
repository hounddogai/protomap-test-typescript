import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditReservation } from "./credit-reservation.js";

test("CreditReservation starts in requested", () => {
  const item = newCreditReservation("code-353", "title-308");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditReservation moves to expired", () => {
  const item = newCreditReservation("code-353", "title-308");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("CreditReservation rejects moves from expired", () => {
  const item = newCreditReservation("code-353", "title-308");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
