import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleWindowExternalRefLengthRule,
  RewardRuleWindowRatioRangeRule,
  RewardRuleWindowRequiredNameRule,
  defaultRewardRuleWindowValidator,
} from "./reward-rule-window-rules.js";
import { newRewardRuleWindow } from "./reward-rule-window.js";

test("RewardRuleWindowValidator reports every problem", () => {
  const validator = defaultRewardRuleWindowValidator();
  const item = newRewardRuleWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleWindowExternalRefLengthRule flags a long external ref", () => {
  const rule = new RewardRuleWindowExternalRefLengthRule(120);
  const item = newRewardRuleWindow("x", "y");
  item.externalRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleWindowRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleWindowRequiredNameRule("reward rule window needs this field");
  const item = newRewardRuleWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleWindowRatioRangeRule flags values above ratio", () => {
  const rule = new RewardRuleWindowRatioRangeRule(2.6, 202.9);
  const item = newRewardRuleWindow("x", "y");
  item.ratio = 204.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
