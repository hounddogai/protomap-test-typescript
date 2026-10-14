import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyEnrollmentReservation } from "./legacy-enrollment-reservation.js";

test("LegacyEnrollmentReservation starts in new", () => {
  const item = newLegacyEnrollmentReservation("code-971", "title-597");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyEnrollmentReservation moves to running", () => {
  const item = newLegacyEnrollmentReservation("code-971", "title-597");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyEnrollmentReservation rejects moves from failed", () => {
  const item = newLegacyEnrollmentReservation("code-971", "title-597");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
