import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryCreditReservation } from "./primary-credit-reservation.js";

test("PrimaryCreditReservation starts in idle", () => {
  const item = newPrimaryCreditReservation("code-378", "name-234");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryCreditReservation moves to ready", () => {
  const item = newPrimaryCreditReservation("code-378", "name-234");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PrimaryCreditReservation rejects moves from stopped", () => {
  const item = newPrimaryCreditReservation("code-378", "name-234");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
