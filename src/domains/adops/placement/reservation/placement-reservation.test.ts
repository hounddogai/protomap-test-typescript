import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementReservation } from "./placement-reservation.js";

test("PlacementReservation starts in open", () => {
  const item = newPlacementReservation("code-709", "label-338");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementReservation moves to in review", () => {
  const item = newPlacementReservation("code-709", "label-338");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PlacementReservation rejects moves from archived", () => {
  const item = newPlacementReservation("code-709", "label-338");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
