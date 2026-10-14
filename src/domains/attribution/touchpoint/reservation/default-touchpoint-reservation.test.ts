import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

test("DefaultTouchpointReservation starts in open", () => {
  const item = newDefaultTouchpointReservation("code-134", "label-564");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultTouchpointReservation moves to resolved", () => {
  const item = newDefaultTouchpointReservation("code-134", "label-564");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultTouchpointReservation rejects moves from archived", () => {
  const item = newDefaultTouchpointReservation("code-134", "label-564");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
