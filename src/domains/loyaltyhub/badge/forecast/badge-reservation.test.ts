import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeReservation } from "./badge-reservation.js";

test("BadgeReservation starts in open", () => {
  const item = newBadgeReservation("code-265", "label-133");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeReservation moves to resolved", () => {
  const item = newBadgeReservation("code-265", "label-133");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BadgeReservation rejects moves from archived", () => {
  const item = newBadgeReservation("code-265", "label-133");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
