import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInReservation } from "./legacy-double-opt-in-reservation.js";

test("LegacyDoubleOptInReservation starts in proposed", () => {
  const item = newLegacyDoubleOptInReservation("code-968", "title-58");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInReservation moves to rejected", () => {
  const item = newLegacyDoubleOptInReservation("code-968", "title-58");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LegacyDoubleOptInReservation rejects moves from withdrawn", () => {
  const item = newLegacyDoubleOptInReservation("code-968", "title-58");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
