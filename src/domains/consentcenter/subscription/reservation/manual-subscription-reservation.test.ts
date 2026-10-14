import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSubscriptionReservation } from "./manual-subscription-reservation.js";

test("ManualSubscriptionReservation starts in planned", () => {
  const item = newManualSubscriptionReservation("code-243", "title-274");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSubscriptionReservation moves to scheduled", () => {
  const item = newManualSubscriptionReservation("code-243", "title-274");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualSubscriptionReservation rejects moves from cancelled", () => {
  const item = newManualSubscriptionReservation("code-243", "title-274");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
