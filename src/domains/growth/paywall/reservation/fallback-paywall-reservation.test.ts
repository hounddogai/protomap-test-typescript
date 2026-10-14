import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPaywallReservation } from "./fallback-paywall-reservation.js";

test("FallbackPaywallReservation starts in proposed", () => {
  const item = newFallbackPaywallReservation("code-461", "label-210");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPaywallReservation moves to withdrawn", () => {
  const item = newFallbackPaywallReservation("code-461", "label-210");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("FallbackPaywallReservation rejects moves from withdrawn", () => {
  const item = newFallbackPaywallReservation("code-461", "label-210");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
