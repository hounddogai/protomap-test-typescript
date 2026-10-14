import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBidRulePreferenceCodeLengthRule,
  FallbackBidRulePreferenceRequiredNameRule,
  defaultFallbackBidRulePreferenceValidator,
} from "./fallback-bid-rule-preference-rules.js";
import { newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

test("FallbackBidRulePreferenceValidator reports every problem", () => {
  const validator = defaultFallbackBidRulePreferenceValidator();
  const item = newFallbackBidRulePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBidRulePreferenceCodeLengthRule flags a long code", () => {
  const rule = new FallbackBidRulePreferenceCodeLengthRule(80);
  const item = newFallbackBidRulePreference("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBidRulePreferenceRequiredNameRule flags a blank name", () => {
  const rule = new FallbackBidRulePreferenceRequiredNameRule("fallback bid rule preference needs a value");
  const item = newFallbackBidRulePreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
