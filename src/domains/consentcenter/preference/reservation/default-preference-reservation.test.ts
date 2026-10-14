import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPreferenceReservation } from "./default-preference-reservation.js";

test("DefaultPreferenceReservation starts in new", () => {
  const item = newDefaultPreferenceReservation("code-37", "label-615");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPreferenceReservation moves to done", () => {
  const item = newDefaultPreferenceReservation("code-37", "label-615");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DefaultPreferenceReservation rejects moves from failed", () => {
  const item = newDefaultPreferenceReservation("code-37", "label-615");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
