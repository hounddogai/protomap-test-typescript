import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostReservation } from "./post-reservation.js";

test("PostReservation starts in planned", () => {
  const item = newPostReservation("code-911", "title-522");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostReservation moves to scheduled", () => {
  const item = newPostReservation("code-911", "title-522");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PostReservation rejects moves from cancelled", () => {
  const item = newPostReservation("code-911", "title-522");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
