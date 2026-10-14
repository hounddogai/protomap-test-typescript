import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDeflectionReservation } from "./batched-deflection-reservation.js";

test("BatchedDeflectionReservation starts in open", () => {
  const item = newBatchedDeflectionReservation("code-542", "label-599");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDeflectionReservation moves to in review", () => {
  const item = newBatchedDeflectionReservation("code-542", "label-599");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedDeflectionReservation rejects moves from archived", () => {
  const item = newBatchedDeflectionReservation("code-542", "label-599");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
