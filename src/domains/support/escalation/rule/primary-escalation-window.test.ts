import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryEscalationWindow } from "./primary-escalation-window.js";

test("PrimaryEscalationWindow starts in planned", () => {
  const item = newPrimaryEscalationWindow("code-227", "label-310");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryEscalationWindow moves to scheduled", () => {
  const item = newPrimaryEscalationWindow("code-227", "label-310");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryEscalationWindow rejects moves from cancelled", () => {
  const item = newPrimaryEscalationWindow("code-227", "label-310");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
