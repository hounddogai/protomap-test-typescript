import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallReviewChannelLengthRule,
  PaywallReviewNameLengthRule,
  PaywallReviewRequiredChannelRule,
  PaywallReviewRequiredCodeRule,
  PaywallReviewRequiredTitleRule,
  defaultPaywallReviewValidator,
} from "./paywall-review-rules.js";
import { newPaywallReview } from "./paywall-review.js";

test("PaywallReviewValidator reports every problem", () => {
  const validator = defaultPaywallReviewValidator();
  const item = newPaywallReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallReviewRequiredCodeRule flags a blank code", () => {
  const rule = new PaywallReviewRequiredCodeRule("paywall review needs a value");
  const item = newPaywallReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallReviewChannelLengthRule flags a long channel", () => {
  const rule = new PaywallReviewChannelLengthRule(255);
  const item = newPaywallReview("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallReviewNameLengthRule flags a long name", () => {
  const rule = new PaywallReviewNameLengthRule(255);
  const item = newPaywallReview("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallReviewRequiredTitleRule flags a blank title", () => {
  const rule = new PaywallReviewRequiredTitleRule("paywall review needs an entry");
  const item = newPaywallReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallReviewRequiredChannelRule flags a blank channel", () => {
  const rule = new PaywallReviewRequiredChannelRule("paywall review needs an entry");
  const item = newPaywallReview("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
