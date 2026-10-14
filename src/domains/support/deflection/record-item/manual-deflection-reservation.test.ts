import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualDeflectionReservation } from "./manual-deflection-reservation.js";

test("ManualDeflectionReservation starts in proposed", () => {
  const item = newManualDeflectionReservation("code-799", "title-340");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualDeflectionReservation moves to rejected", () => {
  const item = newManualDeflectionReservation("code-799", "title-340");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ManualDeflectionReservation rejects moves from withdrawn", () => {
  const item = newManualDeflectionReservation("code-799", "title-340");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
