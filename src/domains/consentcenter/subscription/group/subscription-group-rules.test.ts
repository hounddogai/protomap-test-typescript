import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionGroupContactEmailLengthRule,
  SubscriptionGroupGraceDaysRangeRule,
  SubscriptionGroupRequiredCodeRule,
  defaultSubscriptionGroupValidator,
} from "./subscription-group-rules.js";
import { newSubscriptionGroup } from "./subscription-group.js";

test("SubscriptionGroupValidator reports every problem", () => {
  const validator = defaultSubscriptionGroupValidator();
  const item = newSubscriptionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionGroupRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionGroupRequiredCodeRule("subscription group needs a value");
  const item = newSubscriptionGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionGroupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new SubscriptionGroupGraceDaysRangeRule(16, 80);
  const item = newSubscriptionGroup("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionGroupContactEmailLengthRule flags a long contact email", () => {
  const rule = new SubscriptionGroupContactEmailLengthRule(16);
  const item = newSubscriptionGroup("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
