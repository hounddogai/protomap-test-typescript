import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPacingReservation } from "./default-pacing-reservation.js";

test("DefaultPacingReservation starts in requested", () => {
  const item = newDefaultPacingReservation("code-698", "label-87");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPacingReservation moves to revoked", () => {
  const item = newDefaultPacingReservation("code-698", "label-87");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DefaultPacingReservation rejects moves from expired", () => {
  const item = newDefaultPacingReservation("code-698", "label-87");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
