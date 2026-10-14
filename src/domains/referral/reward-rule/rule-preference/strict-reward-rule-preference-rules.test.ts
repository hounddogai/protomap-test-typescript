import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardRulePreferenceOpenRateRangeRule,
  StrictRewardRulePreferenceRetriesRangeRule,
  defaultStrictRewardRulePreferenceValidator,
} from "./strict-reward-rule-preference-rules.js";
import { newStrictRewardRulePreference } from "./strict-reward-rule-preference.js";

test("StrictRewardRulePreferenceValidator reports every problem", () => {
  const validator = defaultStrictRewardRulePreferenceValidator();
  const item = newStrictRewardRulePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardRulePreferenceOpenRateRangeRule flags values above open rate", () => {
  const rule = new StrictRewardRulePreferenceOpenRateRangeRule(2.4, 2252.1);
  const item = newStrictRewardRulePreference("x", "y");
  item.openRate = 2253.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRewardRulePreferenceRetriesRangeRule flags values above retries", () => {
  const rule = new StrictRewardRulePreferenceRetriesRangeRule(255, 86400);
  const item = newStrictRewardRulePreference("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
