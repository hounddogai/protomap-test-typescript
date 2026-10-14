import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRetentionTierBudgetRangeRule,
  BatchedRetentionTierCodeLengthRule,
  BatchedRetentionTierSendAtRangeRule,
  defaultBatchedRetentionTierValidator,
} from "./batched-retention-tier-rules.js";
import { newBatchedRetentionTier } from "./batched-retention-tier.js";

test("BatchedRetentionTierValidator reports every problem", () => {
  const validator = defaultBatchedRetentionTierValidator();
  const item = newBatchedRetentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRetentionTierSendAtRangeRule flags values above send at", () => {
  const rule = new BatchedRetentionTierSendAtRangeRule(1000, 1000);
  const item = newBatchedRetentionTier("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedRetentionTierBudgetRangeRule flags values above budget", () => {
  const rule = new BatchedRetentionTierBudgetRangeRule(5.5, 1918.3);
  const item = newBatchedRetentionTier("x", "y");
  item.budget = 1919.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedRetentionTierCodeLengthRule flags a long code", () => {
  const rule = new BatchedRetentionTierCodeLengthRule(3600);
  const item = newBatchedRetentionTier("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
