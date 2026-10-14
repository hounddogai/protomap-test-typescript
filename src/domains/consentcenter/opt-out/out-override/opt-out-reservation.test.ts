import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutReservation } from "./opt-out-reservation.js";

test("OptOutReservation starts in planned", () => {
  const item = newOptOutReservation("code-81", "label-107");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutReservation moves to completed", () => {
  const item = newOptOutReservation("code-81", "label-107");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("OptOutReservation rejects moves from cancelled", () => {
  const item = newOptOutReservation("code-81", "label-107");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
