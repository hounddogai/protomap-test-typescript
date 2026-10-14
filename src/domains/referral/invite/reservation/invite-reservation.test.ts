import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteReservation } from "./invite-reservation.js";

test("InviteReservation starts in idle", () => {
  const item = newInviteReservation("code-230", "title-52");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteReservation moves to draining", () => {
  const item = newInviteReservation("code-230", "title-52");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("InviteReservation rejects moves from stopped", () => {
  const item = newInviteReservation("code-230", "title-52");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
