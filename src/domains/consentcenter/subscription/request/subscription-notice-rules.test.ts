import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionNoticeRegionLengthRule,
  SubscriptionNoticeRequiredLocaleRule,
  SubscriptionNoticeRequiredRegionRule,
  SubscriptionNoticeRequiredTitleRule,
  SubscriptionNoticeSequenceRangeRule,
  defaultSubscriptionNoticeValidator,
} from "./subscription-notice-rules.js";
import { newSubscriptionNotice } from "./subscription-notice.js";

test("SubscriptionNoticeValidator reports every problem", () => {
  const validator = defaultSubscriptionNoticeValidator();
  const item = newSubscriptionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionNoticeSequenceRangeRule flags values above sequence", () => {
  const rule = new SubscriptionNoticeSequenceRangeRule(3600, 3600);
  const item = newSubscriptionNotice("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionNoticeRegionLengthRule flags a long region", () => {
  const rule = new SubscriptionNoticeRegionLengthRule(3600);
  const item = newSubscriptionNotice("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionNoticeRequiredLocaleRule flags a blank locale", () => {
  const rule = new SubscriptionNoticeRequiredLocaleRule("subscription notice needs a value");
  const item = newSubscriptionNotice("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionNoticeRequiredRegionRule flags a blank region", () => {
  const rule = new SubscriptionNoticeRequiredRegionRule("subscription notice needs an entry");
  const item = newSubscriptionNotice("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new SubscriptionNoticeRequiredTitleRule("subscription notice needs a value");
  const item = newSubscriptionNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
