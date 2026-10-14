import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

test("RegionalSubscriptionReservation starts in open", () => {
  const item = newRegionalSubscriptionReservation("code-113", "title-29");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSubscriptionReservation moves to reopened", () => {
  const item = newRegionalSubscriptionReservation("code-113", "title-29");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalSubscriptionReservation rejects moves from archived", () => {
  const item = newRegionalSubscriptionReservation("code-113", "title-29");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
