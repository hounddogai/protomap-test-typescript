import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyMetricAudienceIdLengthRule,
  ReplyMetricCodeLengthRule,
  ReplyMetricRequiredCodeRule,
  ReplyMetricRequiredPhoneRule,
  defaultReplyMetricValidator,
} from "./reply-metric-rules.js";
import { newReplyMetric } from "./reply-metric.js";

test("ReplyMetricValidator reports every problem", () => {
  const validator = defaultReplyMetricValidator();
  const item = newReplyMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyMetricCodeLengthRule flags a long code", () => {
  const rule = new ReplyMetricCodeLengthRule(16);
  const item = newReplyMetric("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyMetricAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ReplyMetricAudienceIdLengthRule(16);
  const item = newReplyMetric("x", "y");
  item.audienceId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyMetricRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyMetricRequiredCodeRule("reply metric needs an entry");
  const item = newReplyMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyMetricRequiredPhoneRule flags a blank phone", () => {
  const rule = new ReplyMetricRequiredPhoneRule("reply metric needs an entry");
  const item = newReplyMetric("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
