import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultStreakReservation } from "./default-streak-reservation.js";

test("DefaultStreakReservation starts in created", () => {
  const item = newDefaultStreakReservation("code-534", "name-832");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultStreakReservation moves to validated", () => {
  const item = newDefaultStreakReservation("code-534", "name-832");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultStreakReservation rejects moves from retired", () => {
  const item = newDefaultStreakReservation("code-534", "name-832");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
