import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceReservation } from "./tiered-bounce-reservation.js";

test("TieredBounceReservation starts in created", () => {
  const item = newTieredBounceReservation("code-137", "label-219");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceReservation moves to published", () => {
  const item = newTieredBounceReservation("code-137", "label-219");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredBounceReservation rejects moves from retired", () => {
  const item = newTieredBounceReservation("code-137", "label-219");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
