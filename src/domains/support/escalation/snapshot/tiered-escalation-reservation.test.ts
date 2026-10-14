import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEscalationReservation } from "./tiered-escalation-reservation.js";

test("TieredEscalationReservation starts in proposed", () => {
  const item = newTieredEscalationReservation("code-177", "label-841");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEscalationReservation moves to approved", () => {
  const item = newTieredEscalationReservation("code-177", "label-841");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredEscalationReservation rejects moves from withdrawn", () => {
  const item = newTieredEscalationReservation("code-177", "label-841");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
