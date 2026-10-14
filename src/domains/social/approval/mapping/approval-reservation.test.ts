import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalReservation } from "./approval-reservation.js";

test("ApprovalReservation starts in idle", () => {
  const item = newApprovalReservation("code-509", "title-530");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalReservation moves to warming", () => {
  const item = newApprovalReservation("code-509", "title-530");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ApprovalReservation rejects moves from stopped", () => {
  const item = newApprovalReservation("code-509", "title-530");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
