import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationRule } from "./escalation-rule.js";

test("EscalationRule starts in created", () => {
  const item = newEscalationRule("code-518", "label-592");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationRule moves to validated", () => {
  const item = newEscalationRule("code-518", "label-592");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("EscalationRule rejects moves from retired", () => {
  const item = newEscalationRule("code-518", "label-592");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
