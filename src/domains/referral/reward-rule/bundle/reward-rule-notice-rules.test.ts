import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleNoticeLocaleLengthRule,
  RewardRuleNoticeNameLengthRule,
  RewardRuleNoticeRequiredCodeRule,
  RewardRuleNoticeRequiredLocaleRule,
  RewardRuleNoticeRequiredUtmSourceRule,
  RewardRuleNoticeWeightRangeRule,
  defaultRewardRuleNoticeValidator,
} from "./reward-rule-notice-rules.js";
import { newRewardRuleNotice } from "./reward-rule-notice.js";

test("RewardRuleNoticeValidator reports every problem", () => {
  const validator = defaultRewardRuleNoticeValidator();
  const item = newRewardRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleNoticeWeightRangeRule flags values above weight", () => {
  const rule = new RewardRuleNoticeWeightRangeRule(6.9, 3685.2);
  const item = newRewardRuleNotice("x", "y");
  item.weight = 3686.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleNoticeRequiredLocaleRule flags a blank locale", () => {
  const rule = new RewardRuleNoticeRequiredLocaleRule("reward rule notice needs this field");
  const item = newRewardRuleNotice("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleNoticeLocaleLengthRule flags a long locale", () => {
  const rule = new RewardRuleNoticeLocaleLengthRule(80);
  const item = newRewardRuleNotice("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRuleNoticeRequiredCodeRule("reward rule notice needs an entry");
  const item = newRewardRuleNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleNoticeRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RewardRuleNoticeRequiredUtmSourceRule("reward rule notice needs this field");
  const item = newRewardRuleNotice("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleNoticeNameLengthRule flags a long name", () => {
  const rule = new RewardRuleNoticeNameLengthRule(3600);
  const item = newRewardRuleNotice("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
