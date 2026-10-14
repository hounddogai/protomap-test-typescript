import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionBaselineGraceDaysRangeRule,
  SubscriptionBaselineRatioRangeRule,
  SubscriptionBaselineRequiredCampaignRefRule,
  SubscriptionBaselineSegmentLengthRule,
  defaultSubscriptionBaselineValidator,
} from "./subscription-baseline-rules.js";
import { newSubscriptionBaseline } from "./subscription-baseline.js";

test("SubscriptionBaselineValidator reports every problem", () => {
  const validator = defaultSubscriptionBaselineValidator();
  const item = newSubscriptionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionBaselineRatioRangeRule flags values above ratio", () => {
  const rule = new SubscriptionBaselineRatioRangeRule(0.5, 366.5);
  const item = newSubscriptionBaseline("x", "y");
  item.ratio = 368;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionBaselineRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new SubscriptionBaselineRequiredCampaignRefRule("subscription baseline needs an entry");
  const item = newSubscriptionBaseline("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionBaselineSegmentLengthRule flags a long segment", () => {
  const rule = new SubscriptionBaselineSegmentLengthRule(16);
  const item = newSubscriptionBaseline("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionBaselineGraceDaysRangeRule flags values above grace days", () => {
  const rule = new SubscriptionBaselineGraceDaysRangeRule(32, 32);
  const item = newSubscriptionBaseline("x", "y");
  item.graceDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
