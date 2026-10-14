import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSenderReservation } from "./fallback-sender-reservation.js";

test("FallbackSenderReservation starts in created", () => {
  const item = newFallbackSenderReservation("code-583", "title-531");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSenderReservation moves to validated", () => {
  const item = newFallbackSenderReservation("code-583", "title-531");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackSenderReservation rejects moves from retired", () => {
  const item = newFallbackSenderReservation("code-583", "title-531");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
