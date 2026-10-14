import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultComplaintReservation } from "./default-complaint-reservation.js";

test("DefaultComplaintReservation starts in proposed", () => {
  const item = newDefaultComplaintReservation("code-83", "title-137");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultComplaintReservation moves to withdrawn", () => {
  const item = newDefaultComplaintReservation("code-83", "title-137");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DefaultComplaintReservation rejects moves from withdrawn", () => {
  const item = newDefaultComplaintReservation("code-83", "title-137");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
