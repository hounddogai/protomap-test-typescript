import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyThresholdNameLengthRule,
  ReplyThresholdOpenRateRangeRule,
  ReplyThresholdRequiredNameRule,
  defaultReplyThresholdValidator,
} from "./reply-threshold-rules.js";
import { newReplyThreshold } from "./reply-threshold.js";

test("ReplyThresholdValidator reports every problem", () => {
  const validator = defaultReplyThresholdValidator();
  const item = newReplyThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyThresholdRequiredNameRule flags a blank name", () => {
  const rule = new ReplyThresholdRequiredNameRule("reply threshold needs this field");
  const item = newReplyThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyThresholdOpenRateRangeRule flags values above open rate", () => {
  const rule = new ReplyThresholdOpenRateRangeRule(5.8, 2582.6);
  const item = newReplyThreshold("x", "y");
  item.openRate = 2584.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyThresholdNameLengthRule flags a long name", () => {
  const rule = new ReplyThresholdNameLengthRule(64);
  const item = newReplyThreshold("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
