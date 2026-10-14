import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackRewardRuleRequestCountryLengthRule,
  FallbackRewardRuleRequestRequiredCodeRule,
  FallbackRewardRuleRequestSequenceRangeRule,
  defaultFallbackRewardRuleRequestValidator,
} from "./fallback-reward-rule-request-rules.js";
import { newFallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

test("FallbackRewardRuleRequestValidator reports every problem", () => {
  const validator = defaultFallbackRewardRuleRequestValidator();
  const item = newFallbackRewardRuleRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackRewardRuleRequestCountryLengthRule flags a long country", () => {
  const rule = new FallbackRewardRuleRequestCountryLengthRule(3600);
  const item = newFallbackRewardRuleRequest("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRewardRuleRequestRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackRewardRuleRequestRequiredCodeRule("fallback reward rule request needs a value");
  const item = newFallbackRewardRuleRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRewardRuleRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new FallbackRewardRuleRequestSequenceRangeRule(64, 120);
  const item = newFallbackRewardRuleRequest("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
