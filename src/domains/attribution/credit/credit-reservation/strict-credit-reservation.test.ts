import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreditReservation } from "./strict-credit-reservation.js";

test("StrictCreditReservation starts in created", () => {
  const item = newStrictCreditReservation("code-345", "label-888");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreditReservation moves to retired", () => {
  const item = newStrictCreditReservation("code-345", "label-888");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("StrictCreditReservation rejects moves from retired", () => {
  const item = newStrictCreditReservation("code-345", "label-888");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
