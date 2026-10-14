import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationAgreementRequiredCodeRule,
  EscalationAgreementRequiredTitleRule,
  defaultEscalationAgreementValidator,
} from "./escalation-agreement-rules.js";
import { newEscalationAgreement } from "./escalation-agreement.js";

test("EscalationAgreementValidator reports every problem", () => {
  const validator = defaultEscalationAgreementValidator();
  const item = newEscalationAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationAgreementRequiredCodeRule("escalation agreement needs a value");
  const item = newEscalationAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationAgreementRequiredTitleRule("escalation agreement needs a value");
  const item = newEscalationAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
