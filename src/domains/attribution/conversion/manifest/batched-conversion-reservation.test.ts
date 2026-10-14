import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedConversionReservation } from "./batched-conversion-reservation.js";

test("BatchedConversionReservation starts in requested", () => {
  const item = newBatchedConversionReservation("code-74", "title-765");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedConversionReservation moves to granted", () => {
  const item = newBatchedConversionReservation("code-74", "title-765");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedConversionReservation rejects moves from expired", () => {
  const item = newBatchedConversionReservation("code-74", "title-765");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
