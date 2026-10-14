import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySubscriptionRequestCodeLengthRule,
  PrimarySubscriptionRequestMaximumRangeRule,
  PrimarySubscriptionRequestRequiredChannelRule,
  PrimarySubscriptionRequestReviewerLengthRule,
  defaultPrimarySubscriptionRequestValidator,
} from "./primary-subscription-request-rules.js";
import { newPrimarySubscriptionRequest } from "./primary-subscription-request.js";

test("PrimarySubscriptionRequestValidator reports every problem", () => {
  const validator = defaultPrimarySubscriptionRequestValidator();
  const item = newPrimarySubscriptionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySubscriptionRequestMaximumRangeRule flags values above maximum", () => {
  const rule = new PrimarySubscriptionRequestMaximumRangeRule(5.7, 2785.3);
  const item = newPrimarySubscriptionRequest("x", "y");
  item.maximum = 2786.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySubscriptionRequestRequiredChannelRule flags a blank channel", () => {
  const rule = new PrimarySubscriptionRequestRequiredChannelRule("primary subscription request needs a value");
  const item = newPrimarySubscriptionRequest("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySubscriptionRequestCodeLengthRule flags a long code", () => {
  const rule = new PrimarySubscriptionRequestCodeLengthRule(80);
  const item = newPrimarySubscriptionRequest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySubscriptionRequestReviewerLengthRule flags a long reviewer", () => {
  const rule = new PrimarySubscriptionRequestReviewerLengthRule(3600);
  const item = newPrimarySubscriptionRequest("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
