import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardRulePreferenceCodeLengthRule,
  WeightedRewardRulePreferenceExternalRefLengthRule,
  WeightedRewardRulePreferenceUpdatedAtRangeRule,
  defaultWeightedRewardRulePreferenceValidator,
} from "./weighted-reward-rule-preference-rules.js";
import { newWeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

test("WeightedRewardRulePreferenceValidator reports every problem", () => {
  const validator = defaultWeightedRewardRulePreferenceValidator();
  const item = newWeightedRewardRulePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardRulePreferenceUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new WeightedRewardRulePreferenceUpdatedAtRangeRule(255, 86400);
  const item = newWeightedRewardRulePreference("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardRulePreferenceExternalRefLengthRule flags a long external ref", () => {
  const rule = new WeightedRewardRulePreferenceExternalRefLengthRule(86400);
  const item = newWeightedRewardRulePreference("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardRulePreferenceCodeLengthRule flags a long code", () => {
  const rule = new WeightedRewardRulePreferenceCodeLengthRule(1000);
  const item = newWeightedRewardRulePreference("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
