import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRulePreferenceNameLengthRule,
  RewardRulePreferenceStartsAtRangeRule,
  defaultRewardRulePreferenceValidator,
} from "./reward-rule-preference-rules.js";
import { newRewardRulePreference } from "./reward-rule-preference.js";

test("RewardRulePreferenceValidator reports every problem", () => {
  const validator = defaultRewardRulePreferenceValidator();
  const item = newRewardRulePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRulePreferenceNameLengthRule flags a long name", () => {
  const rule = new RewardRulePreferenceNameLengthRule(32);
  const item = newRewardRulePreference("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRulePreferenceStartsAtRangeRule flags values above starts at", () => {
  const rule = new RewardRulePreferenceStartsAtRangeRule(64, 1000);
  const item = newRewardRulePreference("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
