import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleReservation } from "./exit-rule-reservation.js";

test("ExitRuleReservation starts in planned", () => {
  const item = newExitRuleReservation("code-346", "name-216");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleReservation moves to in progress", () => {
  const item = newExitRuleReservation("code-346", "name-216");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ExitRuleReservation rejects moves from cancelled", () => {
  const item = newExitRuleReservation("code-346", "name-216");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
