import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentReservation } from "./enrollment-reservation.js";

test("EnrollmentReservation starts in created", () => {
  const item = newEnrollmentReservation("code-340", "title-401");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentReservation moves to published", () => {
  const item = newEnrollmentReservation("code-340", "title-401");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("EnrollmentReservation rejects moves from retired", () => {
  const item = newEnrollmentReservation("code-340", "title-401");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
