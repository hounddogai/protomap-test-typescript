import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceReservation } from "./preference-reservation.js";

test("PreferenceReservation starts in planned", () => {
  const item = newPreferenceReservation("code-794", "label-969");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceReservation moves to completed", () => {
  const item = newPreferenceReservation("code-794", "label-969");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PreferenceReservation rejects moves from cancelled", () => {
  const item = newPreferenceReservation("code-794", "label-969");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
