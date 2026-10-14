import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBounceReservation } from "./global-bounce-reservation.js";

test("GlobalBounceReservation starts in new", () => {
  const item = newGlobalBounceReservation("code-902", "label-374");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBounceReservation moves to done", () => {
  const item = newGlobalBounceReservation("code-902", "label-374");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("GlobalBounceReservation rejects moves from failed", () => {
  const item = newGlobalBounceReservation("code-902", "label-374");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
