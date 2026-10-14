import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

test("FallbackSuppressionReservation starts in new", () => {
  const item = newFallbackSuppressionReservation("code-239", "label-64");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSuppressionReservation moves to queued", () => {
  const item = newFallbackSuppressionReservation("code-239", "label-64");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackSuppressionReservation rejects moves from failed", () => {
  const item = newFallbackSuppressionReservation("code-239", "label-64");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
