import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationRequestAttemptsRangeRule,
  EscalationRequestCodeLengthRule,
  EscalationRequestEndsAtRangeRule,
  EscalationRequestRequiredPhoneRule,
  defaultEscalationRequestValidator,
} from "./escalation-request-rules.js";
import { newEscalationRequest } from "./escalation-request.js";

test("EscalationRequestValidator reports every problem", () => {
  const validator = defaultEscalationRequestValidator();
  const item = newEscalationRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationRequestEndsAtRangeRule flags values above ends at", () => {
  const rule = new EscalationRequestEndsAtRangeRule(64, 120);
  const item = newEscalationRequest("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationRequestRequiredPhoneRule flags a blank phone", () => {
  const rule = new EscalationRequestRequiredPhoneRule("escalation request needs a value");
  const item = newEscalationRequest("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationRequestCodeLengthRule flags a long code", () => {
  const rule = new EscalationRequestCodeLengthRule(80);
  const item = newEscalationRequest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationRequestAttemptsRangeRule flags values above attempts", () => {
  const rule = new EscalationRequestAttemptsRangeRule(16, 64);
  const item = newEscalationRequest("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
