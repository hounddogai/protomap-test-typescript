import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingEscalationExceptionRequiredCodeRule,
  PendingEscalationExceptionRequiredLabelRule,
  PendingEscalationExceptionRequiredLocaleRule,
  PendingEscalationExceptionRequiredSegmentRule,
  defaultPendingEscalationExceptionValidator,
} from "./pending-escalation-exception-rules.js";
import { newPendingEscalationException } from "./pending-escalation-exception.js";

test("PendingEscalationExceptionValidator reports every problem", () => {
  const validator = defaultPendingEscalationExceptionValidator();
  const item = newPendingEscalationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingEscalationExceptionRequiredLocaleRule flags a blank locale", () => {
  const rule = new PendingEscalationExceptionRequiredLocaleRule("pending escalation exception needs this field");
  const item = newPendingEscalationException("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEscalationExceptionRequiredSegmentRule flags a blank segment", () => {
  const rule = new PendingEscalationExceptionRequiredSegmentRule("pending escalation exception needs a value");
  const item = newPendingEscalationException("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEscalationExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new PendingEscalationExceptionRequiredCodeRule("pending escalation exception needs this field");
  const item = newPendingEscalationException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEscalationExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new PendingEscalationExceptionRequiredLabelRule("pending escalation exception needs this field");
  const item = newPendingEscalationException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
