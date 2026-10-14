import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchReservation } from "./branch-reservation.js";

test("BranchReservation starts in new", () => {
  const item = newBranchReservation("code-273", "title-271");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchReservation moves to queued", () => {
  const item = newBranchReservation("code-273", "title-271");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BranchReservation rejects moves from failed", () => {
  const item = newBranchReservation("code-273", "title-271");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
