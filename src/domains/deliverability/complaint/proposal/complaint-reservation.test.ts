import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintReservation } from "./complaint-reservation.js";

test("ComplaintReservation starts in new", () => {
  const item = newComplaintReservation("code-679", "label-872");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintReservation moves to queued", () => {
  const item = newComplaintReservation("code-679", "label-872");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ComplaintReservation rejects moves from failed", () => {
  const item = newComplaintReservation("code-679", "label-872");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
