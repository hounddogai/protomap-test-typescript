import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionReservation } from "./deflection-reservation.js";

test("DeflectionReservation starts in open", () => {
  const item = newDeflectionReservation("code-671", "label-397");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionReservation moves to in review", () => {
  const item = newDeflectionReservation("code-671", "label-397");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DeflectionReservation rejects moves from archived", () => {
  const item = newDeflectionReservation("code-671", "label-397");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
