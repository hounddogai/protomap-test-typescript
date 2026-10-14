import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWaitReservation } from "./legacy-wait-reservation.js";

test("LegacyWaitReservation starts in new", () => {
  const item = newLegacyWaitReservation("code-994", "title-402");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWaitReservation moves to queued", () => {
  const item = newLegacyWaitReservation("code-994", "title-402");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LegacyWaitReservation rejects moves from failed", () => {
  const item = newLegacyWaitReservation("code-994", "title-402");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
