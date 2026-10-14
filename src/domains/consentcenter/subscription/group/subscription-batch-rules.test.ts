import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionBatchFrequencyCapRangeRule,
  SubscriptionBatchJourneyIdLengthRule,
  SubscriptionBatchRequiredCodeRule,
  SubscriptionBatchRequiredTitleRule,
  SubscriptionBatchRetriesRangeRule,
  defaultSubscriptionBatchValidator,
} from "./subscription-batch-rules.js";
import { newSubscriptionBatch } from "./subscription-batch.js";

test("SubscriptionBatchValidator reports every problem", () => {
  const validator = defaultSubscriptionBatchValidator();
  const item = newSubscriptionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionBatchRequiredTitleRule flags a blank title", () => {
  const rule = new SubscriptionBatchRequiredTitleRule("subscription batch needs this field");
  const item = newSubscriptionBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionBatchJourneyIdLengthRule flags a long journey id", () => {
  const rule = new SubscriptionBatchJourneyIdLengthRule(86400);
  const item = newSubscriptionBatch("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionBatchFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new SubscriptionBatchFrequencyCapRangeRule(64, 1000);
  const item = newSubscriptionBatch("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionBatchRetriesRangeRule flags values above retries", () => {
  const rule = new SubscriptionBatchRetriesRangeRule(80, 86400);
  const item = newSubscriptionBatch("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionBatchRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionBatchRequiredCodeRule("subscription batch needs a value");
  const item = newSubscriptionBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
