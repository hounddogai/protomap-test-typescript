import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingActivationReservation } from "./rolling-activation-reservation.js";

test("RollingActivationReservation starts in new", () => {
  const item = newRollingActivationReservation("code-64", "label-773");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingActivationReservation moves to running", () => {
  const item = newRollingActivationReservation("code-64", "label-773");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RollingActivationReservation rejects moves from failed", () => {
  const item = newRollingActivationReservation("code-64", "label-773");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
