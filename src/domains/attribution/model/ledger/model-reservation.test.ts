import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelReservation } from "./model-reservation.js";

test("ModelReservation starts in requested", () => {
  const item = newModelReservation("code-223", "name-924");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelReservation moves to revoked", () => {
  const item = newModelReservation("code-223", "name-924");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ModelReservation rejects moves from expired", () => {
  const item = newModelReservation("code-223", "name-924");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
