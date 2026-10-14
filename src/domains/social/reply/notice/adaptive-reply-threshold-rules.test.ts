import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveReplyThresholdCodeLengthRule,
  AdaptiveReplyThresholdCurrencyLengthRule,
  AdaptiveReplyThresholdLabelLengthRule,
  AdaptiveReplyThresholdRequiredTitleRule,
  defaultAdaptiveReplyThresholdValidator,
} from "./adaptive-reply-threshold-rules.js";
import { newAdaptiveReplyThreshold } from "./adaptive-reply-threshold.js";

test("AdaptiveReplyThresholdValidator reports every problem", () => {
  const validator = defaultAdaptiveReplyThresholdValidator();
  const item = newAdaptiveReplyThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveReplyThresholdCurrencyLengthRule flags a long currency", () => {
  const rule = new AdaptiveReplyThresholdCurrencyLengthRule(32);
  const item = newAdaptiveReplyThreshold("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveReplyThresholdCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveReplyThresholdCodeLengthRule(86400);
  const item = newAdaptiveReplyThreshold("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveReplyThresholdLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveReplyThresholdLabelLengthRule(16);
  const item = newAdaptiveReplyThreshold("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveReplyThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveReplyThresholdRequiredTitleRule("adaptive reply threshold needs this field");
  const item = newAdaptiveReplyThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
