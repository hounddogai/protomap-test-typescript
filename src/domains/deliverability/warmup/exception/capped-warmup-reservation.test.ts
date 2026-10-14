import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWarmupReservation } from "./capped-warmup-reservation.js";

test("CappedWarmupReservation starts in planned", () => {
  const item = newCappedWarmupReservation("code-746", "name-824");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWarmupReservation moves to scheduled", () => {
  const item = newCappedWarmupReservation("code-746", "name-824");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedWarmupReservation rejects moves from cancelled", () => {
  const item = newCappedWarmupReservation("code-746", "name-824");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
