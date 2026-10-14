import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationAgreement } from "./escalation-agreement.js";

test("EscalationAgreement starts in open", () => {
  const item = newEscalationAgreement("code-139", "title-899");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationAgreement moves to in review", () => {
  const item = newEscalationAgreement("code-139", "title-899");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("EscalationAgreement rejects moves from archived", () => {
  const item = newEscalationAgreement("code-139", "title-899");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
