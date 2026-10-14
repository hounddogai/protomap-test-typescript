import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

test("BatchedFraudCheckReservation starts in open", () => {
  const item = newBatchedFraudCheckReservation("code-395", "title-679");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFraudCheckReservation moves to in review", () => {
  const item = newBatchedFraudCheckReservation("code-395", "title-679");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedFraudCheckReservation rejects moves from archived", () => {
  const item = newBatchedFraudCheckReservation("code-395", "title-679");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
