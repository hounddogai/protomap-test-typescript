import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLevelReservation } from "./tiered-level-reservation.js";

test("TieredLevelReservation starts in requested", () => {
  const item = newTieredLevelReservation("code-46", "title-257");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLevelReservation moves to expired", () => {
  const item = newTieredLevelReservation("code-46", "title-257");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TieredLevelReservation rejects moves from expired", () => {
  const item = newTieredLevelReservation("code-46", "title-257");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
