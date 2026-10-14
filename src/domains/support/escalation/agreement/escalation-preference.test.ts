import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationPreference } from "./escalation-preference.js";

test("EscalationPreference starts in planned", () => {
  const item = newEscalationPreference("code-150", "label-278");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationPreference moves to in progress", () => {
  const item = newEscalationPreference("code-150", "label-278");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("EscalationPreference rejects moves from cancelled", () => {
  const item = newEscalationPreference("code-150", "label-278");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
