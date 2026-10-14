import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyReservation } from "./frequency-reservation.js";

test("FrequencyReservation starts in draft", () => {
  const item = newFrequencyReservation("code-598", "name-880");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyReservation moves to suspended", () => {
  const item = newFrequencyReservation("code-598", "name-880");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("FrequencyReservation rejects moves from closed", () => {
  const item = newFrequencyReservation("code-598", "name-880");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
