import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionReservation } from "./retention-reservation.js";

test("RetentionReservation starts in created", () => {
  const item = newRetentionReservation("code-215", "name-584");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionReservation moves to validated", () => {
  const item = newRetentionReservation("code-215", "name-584");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RetentionReservation rejects moves from retired", () => {
  const item = newRetentionReservation("code-215", "name-584");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
