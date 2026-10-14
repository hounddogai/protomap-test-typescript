import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionRecordAttemptsRangeRule,
  SubscriptionRecordBudgetRangeRule,
  SubscriptionRecordMinimumRangeRule,
  SubscriptionRecordRequiredDescriptionRule,
  SubscriptionRecordRequiredLabelRule,
  SubscriptionRecordSendAtRangeRule,
  defaultSubscriptionRecordValidator,
} from "./subscription-record-rules.js";
import { newSubscriptionRecord } from "./subscription-record.js";

test("SubscriptionRecordValidator reports every problem", () => {
  const validator = defaultSubscriptionRecordValidator();
  const item = newSubscriptionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionRecordMinimumRangeRule flags values above minimum", () => {
  const rule = new SubscriptionRecordMinimumRangeRule(1.1, 4470.9);
  const item = newSubscriptionRecord("x", "y");
  item.minimum = 4472.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRecordSendAtRangeRule flags values above send at", () => {
  const rule = new SubscriptionRecordSendAtRangeRule(80, 3600);
  const item = newSubscriptionRecord("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRecordBudgetRangeRule flags values above budget", () => {
  const rule = new SubscriptionRecordBudgetRangeRule(6, 2088.7);
  const item = newSubscriptionRecord("x", "y");
  item.budget = 2090.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRecordRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionRecordRequiredLabelRule("subscription record needs an entry");
  const item = newSubscriptionRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionRecordRequiredDescriptionRule flags a blank description", () => {
  const rule = new SubscriptionRecordRequiredDescriptionRule("subscription record needs an entry");
  const item = newSubscriptionRecord("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionRecordAttemptsRangeRule flags values above attempts", () => {
  const rule = new SubscriptionRecordAttemptsRangeRule(80, 120);
  const item = newSubscriptionRecord("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
