import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPreferenceReservation } from "./manual-preference-reservation.js";

test("ManualPreferenceReservation starts in planned", () => {
  const item = newManualPreferenceReservation("code-885", "name-149");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPreferenceReservation moves to in progress", () => {
  const item = newManualPreferenceReservation("code-885", "name-149");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualPreferenceReservation rejects moves from cancelled", () => {
  const item = newManualPreferenceReservation("code-885", "name-149");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
