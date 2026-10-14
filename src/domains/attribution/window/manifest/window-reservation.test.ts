import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowReservation } from "./window-reservation.js";

test("WindowReservation starts in planned", () => {
  const item = newWindowReservation("code-452", "label-514");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowReservation moves to scheduled", () => {
  const item = newWindowReservation("code-452", "label-514");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WindowReservation rejects moves from cancelled", () => {
  const item = newWindowReservation("code-452", "label-514");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
