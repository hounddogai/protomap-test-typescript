import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationOverrideAmountRangeRule,
  EscalationOverrideCodeLengthRule,
  EscalationOverrideRequiredNameRule,
  EscalationOverrideRequiredReviewerRule,
  defaultEscalationOverrideValidator,
} from "./escalation-override-rules.js";
import { newEscalationOverride } from "./escalation-override.js";

test("EscalationOverrideValidator reports every problem", () => {
  const validator = defaultEscalationOverrideValidator();
  const item = newEscalationOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationOverrideRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new EscalationOverrideRequiredReviewerRule("escalation override needs this field");
  const item = newEscalationOverride("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationOverrideCodeLengthRule flags a long code", () => {
  const rule = new EscalationOverrideCodeLengthRule(16);
  const item = newEscalationOverride("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationOverrideAmountRangeRule flags values above amount", () => {
  const rule = new EscalationOverrideAmountRangeRule(0.9, 2785.8);
  const item = newEscalationOverride("x", "y");
  item.amount = 2787.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationOverrideRequiredNameRule flags a blank name", () => {
  const rule = new EscalationOverrideRequiredNameRule("escalation override needs an entry");
  const item = newEscalationOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
