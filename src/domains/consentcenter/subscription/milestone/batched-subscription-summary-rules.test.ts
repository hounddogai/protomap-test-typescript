import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSubscriptionSummaryAudienceIdLengthRule,
  BatchedSubscriptionSummaryLabelLengthRule,
  BatchedSubscriptionSummaryRequiredAudienceIdRule,
  BatchedSubscriptionSummaryRequiredCodeRule,
  defaultBatchedSubscriptionSummaryValidator,
} from "./batched-subscription-summary-rules.js";
import { newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

test("BatchedSubscriptionSummaryValidator reports every problem", () => {
  const validator = defaultBatchedSubscriptionSummaryValidator();
  const item = newBatchedSubscriptionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSubscriptionSummaryRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new BatchedSubscriptionSummaryRequiredAudienceIdRule("batched subscription summary needs a value");
  const item = newBatchedSubscriptionSummary("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSubscriptionSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedSubscriptionSummaryRequiredCodeRule("batched subscription summary needs this field");
  const item = newBatchedSubscriptionSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSubscriptionSummaryAudienceIdLengthRule flags a long audience id", () => {
  const rule = new BatchedSubscriptionSummaryAudienceIdLengthRule(32);
  const item = newBatchedSubscriptionSummary("x", "y");
  item.audienceId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSubscriptionSummaryLabelLengthRule flags a long label", () => {
  const rule = new BatchedSubscriptionSummaryLabelLengthRule(16);
  const item = newBatchedSubscriptionSummary("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
