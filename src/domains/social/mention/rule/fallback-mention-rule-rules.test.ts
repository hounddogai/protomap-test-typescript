import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackMentionRuleConversionRateRangeRule,
  FallbackMentionRuleRequiredChannelRule,
  FallbackMentionRuleRequiredTitleRule,
  FallbackMentionRuleScoreRangeRule,
  defaultFallbackMentionRuleValidator,
} from "./fallback-mention-rule-rules.js";
import { newFallbackMentionRule } from "./fallback-mention-rule.js";

test("FallbackMentionRuleValidator reports every problem", () => {
  const validator = defaultFallbackMentionRuleValidator();
  const item = newFallbackMentionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackMentionRuleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new FallbackMentionRuleConversionRateRangeRule(7.7, 753);
  const item = newFallbackMentionRule("x", "y");
  item.conversionRate = 754.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackMentionRuleScoreRangeRule flags values above score", () => {
  const rule = new FallbackMentionRuleScoreRangeRule(8.4, 2477.1);
  const item = newFallbackMentionRule("x", "y");
  item.score = 2478.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackMentionRuleRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackMentionRuleRequiredTitleRule("fallback mention rule needs a value");
  const item = newFallbackMentionRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackMentionRuleRequiredChannelRule flags a blank channel", () => {
  const rule = new FallbackMentionRuleRequiredChannelRule("fallback mention rule needs a value");
  const item = newFallbackMentionRule("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
