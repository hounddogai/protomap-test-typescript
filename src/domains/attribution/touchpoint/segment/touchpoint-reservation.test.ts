import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointReservation } from "./touchpoint-reservation.js";

test("TouchpointReservation starts in requested", () => {
  const item = newTouchpointReservation("code-391", "name-852");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointReservation moves to expired", () => {
  const item = newTouchpointReservation("code-391", "name-852");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TouchpointReservation rejects moves from expired", () => {
  const item = newTouchpointReservation("code-391", "name-852");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
