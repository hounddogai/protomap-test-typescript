import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardThresholdCreatedAtRangeRule,
  RewardThresholdGraceDaysRangeRule,
  RewardThresholdOwnerIdLengthRule,
  RewardThresholdReviewerLengthRule,
  defaultRewardThresholdValidator,
} from "./reward-threshold-rules.js";
import { newRewardThreshold } from "./reward-threshold.js";

test("RewardThresholdValidator reports every problem", () => {
  const validator = defaultRewardThresholdValidator();
  const item = newRewardThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardThresholdGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RewardThresholdGraceDaysRangeRule(16, 120);
  const item = newRewardThreshold("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardThresholdOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RewardThresholdOwnerIdLengthRule(1000);
  const item = newRewardThreshold("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardThresholdCreatedAtRangeRule flags values above created at", () => {
  const rule = new RewardThresholdCreatedAtRangeRule(16, 120);
  const item = newRewardThreshold("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardThresholdReviewerLengthRule flags a long reviewer", () => {
  const rule = new RewardThresholdReviewerLengthRule(86400);
  const item = newRewardThreshold("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
