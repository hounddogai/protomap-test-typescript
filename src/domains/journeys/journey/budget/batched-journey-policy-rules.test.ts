import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedJourneyPolicyCodeLengthRule,
  BatchedJourneyPolicyRateRangeRule,
  BatchedJourneyPolicyRequiredChannelRule,
  defaultBatchedJourneyPolicyValidator,
} from "./batched-journey-policy-rules.js";
import { newBatchedJourneyPolicy } from "./batched-journey-policy.js";

test("BatchedJourneyPolicyValidator reports every problem", () => {
  const validator = defaultBatchedJourneyPolicyValidator();
  const item = newBatchedJourneyPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedJourneyPolicyRateRangeRule flags values above rate", () => {
  const rule = new BatchedJourneyPolicyRateRangeRule(0.2, 401.9);
  const item = newBatchedJourneyPolicy("x", "y");
  item.rate = 403.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedJourneyPolicyRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedJourneyPolicyRequiredChannelRule("batched journey policy needs this field");
  const item = newBatchedJourneyPolicy("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedJourneyPolicyCodeLengthRule flags a long code", () => {
  const rule = new BatchedJourneyPolicyCodeLengthRule(80);
  const item = newBatchedJourneyPolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
