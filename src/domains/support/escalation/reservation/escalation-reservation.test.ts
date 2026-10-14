import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationReservation } from "./escalation-reservation.js";

test("EscalationReservation starts in proposed", () => {
  const item = newEscalationReservation("code-592", "title-970");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationReservation moves to rejected", () => {
  const item = newEscalationReservation("code-592", "title-970");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("EscalationReservation rejects moves from withdrawn", () => {
  const item = newEscalationReservation("code-592", "title-970");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
