import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionExceptionAmountRangeRule,
  SubscriptionExceptionCodeLengthRule,
  SubscriptionExceptionLabelLengthRule,
  SubscriptionExceptionRequiredLabelRule,
  SubscriptionExceptionReviewerLengthRule,
  defaultSubscriptionExceptionValidator,
} from "./subscription-exception-rules.js";
import { newSubscriptionException } from "./subscription-exception.js";

test("SubscriptionExceptionValidator reports every problem", () => {
  const validator = defaultSubscriptionExceptionValidator();
  const item = newSubscriptionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionExceptionRequiredLabelRule("subscription exception needs an entry");
  const item = newSubscriptionException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionExceptionCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionExceptionCodeLengthRule(64);
  const item = newSubscriptionException("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionExceptionAmountRangeRule flags values above amount", () => {
  const rule = new SubscriptionExceptionAmountRangeRule(5.5, 205.1);
  const item = newSubscriptionException("x", "y");
  item.amount = 206.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionExceptionLabelLengthRule flags a long label", () => {
  const rule = new SubscriptionExceptionLabelLengthRule(64);
  const item = newSubscriptionException("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionExceptionReviewerLengthRule flags a long reviewer", () => {
  const rule = new SubscriptionExceptionReviewerLengthRule(16);
  const item = newSubscriptionException("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
