import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingConversionReservation } from "./pending-conversion-reservation.js";

test("PendingConversionReservation starts in created", () => {
  const item = newPendingConversionReservation("code-952", "label-725");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingConversionReservation moves to published", () => {
  const item = newPendingConversionReservation("code-952", "label-725");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingConversionReservation rejects moves from retired", () => {
  const item = newPendingConversionReservation("code-952", "label-725");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
