import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleSegmentGraceDaysRangeRule,
  RewardRuleSegmentRatioRangeRule,
  RewardRuleSegmentRequiredChannelRule,
  RewardRuleSegmentRequiredContactEmailRule,
  defaultRewardRuleSegmentValidator,
} from "./reward-rule-segment-rules.js";
import { newRewardRuleSegment } from "./reward-rule-segment.js";

test("RewardRuleSegmentValidator reports every problem", () => {
  const validator = defaultRewardRuleSegmentValidator();
  const item = newRewardRuleSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleSegmentRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RewardRuleSegmentRequiredContactEmailRule("reward rule segment needs a value");
  const item = newRewardRuleSegment("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleSegmentRatioRangeRule flags values above ratio", () => {
  const rule = new RewardRuleSegmentRatioRangeRule(6.9, 2528);
  const item = newRewardRuleSegment("x", "y");
  item.ratio = 2529.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleSegmentGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RewardRuleSegmentGraceDaysRangeRule(80, 3600);
  const item = newRewardRuleSegment("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleSegmentRequiredChannelRule flags a blank channel", () => {
  const rule = new RewardRuleSegmentRequiredChannelRule("reward rule segment needs an entry");
  const item = newRewardRuleSegment("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
