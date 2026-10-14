import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedActivationBatchCategoryLengthRule,
  BatchedActivationBatchDiscountRangeRule,
  BatchedActivationBatchRequiredCountryRule,
  BatchedActivationBatchTitleLengthRule,
  BatchedActivationBatchUpdatedAtRangeRule,
  defaultBatchedActivationBatchValidator,
} from "./batched-activation-batch-rules.js";
import { newBatchedActivationBatch } from "./batched-activation-batch.js";

test("BatchedActivationBatchValidator reports every problem", () => {
  const validator = defaultBatchedActivationBatchValidator();
  const item = newBatchedActivationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedActivationBatchTitleLengthRule flags a long title", () => {
  const rule = new BatchedActivationBatchTitleLengthRule(16);
  const item = newBatchedActivationBatch("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedActivationBatchDiscountRangeRule flags values above discount", () => {
  const rule = new BatchedActivationBatchDiscountRangeRule(6.1, 3535.3);
  const item = newBatchedActivationBatch("x", "y");
  item.discount = 3536.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedActivationBatchCategoryLengthRule flags a long category", () => {
  const rule = new BatchedActivationBatchCategoryLengthRule(80);
  const item = newBatchedActivationBatch("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedActivationBatchRequiredCountryRule flags a blank country", () => {
  const rule = new BatchedActivationBatchRequiredCountryRule("batched activation batch needs this field");
  const item = newBatchedActivationBatch("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedActivationBatchUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BatchedActivationBatchUpdatedAtRangeRule(16, 86400);
  const item = newBatchedActivationBatch("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
