import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceReservation } from "./bounce-reservation.js";

test("BounceReservation starts in created", () => {
  const item = newBounceReservation("code-516", "title-376");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceReservation moves to published", () => {
  const item = newBounceReservation("code-516", "title-376");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BounceReservation rejects moves from retired", () => {
  const item = newBounceReservation("code-516", "title-376");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
