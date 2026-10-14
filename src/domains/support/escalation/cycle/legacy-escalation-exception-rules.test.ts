import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyEscalationExceptionClicksRangeRule,
  LegacyEscalationExceptionRequiredNameRule,
  LegacyEscalationExceptionUtmSourceLengthRule,
  defaultLegacyEscalationExceptionValidator,
} from "./legacy-escalation-exception-rules.js";
import { newLegacyEscalationException } from "./legacy-escalation-exception.js";

test("LegacyEscalationExceptionValidator reports every problem", () => {
  const validator = defaultLegacyEscalationExceptionValidator();
  const item = newLegacyEscalationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyEscalationExceptionClicksRangeRule flags values above clicks", () => {
  const rule = new LegacyEscalationExceptionClicksRangeRule(16, 3600);
  const item = newLegacyEscalationException("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyEscalationExceptionRequiredNameRule flags a blank name", () => {
  const rule = new LegacyEscalationExceptionRequiredNameRule("legacy escalation exception needs this field");
  const item = newLegacyEscalationException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyEscalationExceptionUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LegacyEscalationExceptionUtmSourceLengthRule(16);
  const item = newLegacyEscalationException("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
