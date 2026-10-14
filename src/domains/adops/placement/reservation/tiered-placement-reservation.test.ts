import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementReservation } from "./tiered-placement-reservation.js";

test("TieredPlacementReservation starts in proposed", () => {
  const item = newTieredPlacementReservation("code-491", "title-352");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementReservation moves to approved", () => {
  const item = newTieredPlacementReservation("code-491", "title-352");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredPlacementReservation rejects moves from withdrawn", () => {
  const item = newTieredPlacementReservation("code-491", "title-352");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
