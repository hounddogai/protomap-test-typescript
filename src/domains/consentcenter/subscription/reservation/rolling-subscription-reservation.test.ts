import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSubscriptionReservation } from "./rolling-subscription-reservation.js";

test("RollingSubscriptionReservation starts in proposed", () => {
  const item = newRollingSubscriptionReservation("code-637", "name-833");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSubscriptionReservation moves to approved", () => {
  const item = newRollingSubscriptionReservation("code-637", "name-833");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingSubscriptionReservation rejects moves from withdrawn", () => {
  const item = newRollingSubscriptionReservation("code-637", "name-833");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
