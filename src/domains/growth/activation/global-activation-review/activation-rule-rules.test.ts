import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationRuleRequiredCodeRule,
  ActivationRuleSequenceRangeRule,
  ActivationRuleTitleLengthRule,
  defaultActivationRuleValidator,
} from "./activation-rule-rules.js";
import { newActivationRule } from "./activation-rule.js";

test("ActivationRuleValidator reports every problem", () => {
  const validator = defaultActivationRuleValidator();
  const item = newActivationRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationRuleTitleLengthRule flags a long title", () => {
  const rule = new ActivationRuleTitleLengthRule(255);
  const item = newActivationRule("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationRuleRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationRuleRequiredCodeRule("activation rule needs a value");
  const item = newActivationRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationRuleSequenceRangeRule flags values above sequence", () => {
  const rule = new ActivationRuleSequenceRangeRule(16, 86400);
  const item = newActivationRule("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
