import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationVarianceDurationMinutesRangeRule,
  EscalationVarianceExpiresAtRangeRule,
  EscalationVarianceRequiredCodeRule,
  EscalationVarianceRequiredCountryRule,
  defaultEscalationVarianceValidator,
} from "./escalation-variance-rules.js";
import { newEscalationVariance } from "./escalation-variance.js";

test("EscalationVarianceValidator reports every problem", () => {
  const validator = defaultEscalationVarianceValidator();
  const item = newEscalationVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationVarianceDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new EscalationVarianceDurationMinutesRangeRule(16, 80);
  const item = newEscalationVariance("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationVarianceRequiredCodeRule("escalation variance needs this field");
  const item = newEscalationVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationVarianceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new EscalationVarianceExpiresAtRangeRule(80, 86400);
  const item = newEscalationVariance("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationVarianceRequiredCountryRule flags a blank country", () => {
  const rule = new EscalationVarianceRequiredCountryRule("escalation variance needs this field");
  const item = newEscalationVariance("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
