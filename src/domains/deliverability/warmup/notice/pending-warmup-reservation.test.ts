import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingWarmupReservation } from "./pending-warmup-reservation.js";

test("PendingWarmupReservation starts in requested", () => {
  const item = newPendingWarmupReservation("code-506", "title-366");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingWarmupReservation moves to granted", () => {
  const item = newPendingWarmupReservation("code-506", "title-366");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingWarmupReservation rejects moves from expired", () => {
  const item = newPendingWarmupReservation("code-506", "title-366");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
