import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationRequest } from "./escalation-request.js";

test("EscalationRequest starts in planned", () => {
  const item = newEscalationRequest("code-152", "title-229");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationRequest moves to completed", () => {
  const item = newEscalationRequest("code-152", "title-229");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("EscalationRequest rejects moves from cancelled", () => {
  const item = newEscalationRequest("code-152", "title-229");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
