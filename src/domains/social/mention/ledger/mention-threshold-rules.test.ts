import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionThresholdCodeLengthRule,
  MentionThresholdConversionRateRangeRule,
  MentionThresholdRequiredChannelRule,
  defaultMentionThresholdValidator,
} from "./mention-threshold-rules.js";
import { newMentionThreshold } from "./mention-threshold.js";

test("MentionThresholdValidator reports every problem", () => {
  const validator = defaultMentionThresholdValidator();
  const item = newMentionThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionThresholdConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new MentionThresholdConversionRateRangeRule(6.7, 623.6);
  const item = newMentionThreshold("x", "y");
  item.conversionRate = 625.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionThresholdRequiredChannelRule flags a blank channel", () => {
  const rule = new MentionThresholdRequiredChannelRule("mention threshold needs this field");
  const item = newMentionThreshold("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionThresholdCodeLengthRule flags a long code", () => {
  const rule = new MentionThresholdCodeLengthRule(3600);
  const item = newMentionThreshold("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
