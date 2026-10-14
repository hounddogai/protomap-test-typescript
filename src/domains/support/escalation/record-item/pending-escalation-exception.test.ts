import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingEscalationException } from "./pending-escalation-exception.js";

test("PendingEscalationException starts in planned", () => {
  const item = newPendingEscalationException("code-248", "label-655");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingEscalationException moves to scheduled", () => {
  const item = newPendingEscalationException("code-248", "label-655");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PendingEscalationException rejects moves from cancelled", () => {
  const item = newPendingEscalationException("code-248", "label-655");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
