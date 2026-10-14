import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRedemptionReservation } from "./default-redemption-reservation.js";

test("DefaultRedemptionReservation starts in new", () => {
  const item = newDefaultRedemptionReservation("code-576", "label-322");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRedemptionReservation moves to running", () => {
  const item = newDefaultRedemptionReservation("code-576", "label-322");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DefaultRedemptionReservation rejects moves from failed", () => {
  const item = newDefaultRedemptionReservation("code-576", "label-322");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
