import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSubscriptionNoticeGraceDaysRangeRule,
  PendingSubscriptionNoticeQuantityRangeRule,
  PendingSubscriptionNoticeRequiredUtmSourceRule,
  PendingSubscriptionNoticeScoreRangeRule,
  PendingSubscriptionNoticeUtmSourceLengthRule,
  defaultPendingSubscriptionNoticeValidator,
} from "./pending-subscription-notice-rules.js";
import { newPendingSubscriptionNotice } from "./pending-subscription-notice.js";

test("PendingSubscriptionNoticeValidator reports every problem", () => {
  const validator = defaultPendingSubscriptionNoticeValidator();
  const item = newPendingSubscriptionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSubscriptionNoticeGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PendingSubscriptionNoticeGraceDaysRangeRule(80, 80);
  const item = newPendingSubscriptionNotice("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSubscriptionNoticeUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PendingSubscriptionNoticeUtmSourceLengthRule(16);
  const item = newPendingSubscriptionNotice("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSubscriptionNoticeScoreRangeRule flags values above score", () => {
  const rule = new PendingSubscriptionNoticeScoreRangeRule(3.9, 3037.8);
  const item = newPendingSubscriptionNotice("x", "y");
  item.score = 3039.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSubscriptionNoticeRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PendingSubscriptionNoticeRequiredUtmSourceRule("pending subscription notice needs an entry");
  const item = newPendingSubscriptionNotice("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSubscriptionNoticeQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingSubscriptionNoticeQuantityRangeRule(32, 64);
  const item = newPendingSubscriptionNotice("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
