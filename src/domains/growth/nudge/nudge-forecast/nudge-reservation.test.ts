import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeReservation } from "./nudge-reservation.js";

test("NudgeReservation starts in planned", () => {
  const item = newNudgeReservation("code-395", "title-37");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeReservation moves to completed", () => {
  const item = newNudgeReservation("code-395", "title-37");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("NudgeReservation rejects moves from cancelled", () => {
  const item = newNudgeReservation("code-395", "title-37");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
