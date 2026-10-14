import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedComplaintReservation } from "./weighted-complaint-reservation.js";

test("WeightedComplaintReservation starts in new", () => {
  const item = newWeightedComplaintReservation("code-303", "name-771");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedComplaintReservation moves to failed", () => {
  const item = newWeightedComplaintReservation("code-303", "name-771");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WeightedComplaintReservation rejects moves from failed", () => {
  const item = newWeightedComplaintReservation("code-303", "name-771");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
