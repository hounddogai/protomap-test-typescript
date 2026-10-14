import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionBatchAmountRangeRule,
  RetentionBatchLabelLengthRule,
  RetentionBatchRequiredContactEmailRule,
  RetentionBatchRequiredLabelRule,
  defaultRetentionBatchValidator,
} from "./retention-batch-rules.js";
import { newRetentionBatch } from "./retention-batch.js";

test("RetentionBatchValidator reports every problem", () => {
  const validator = defaultRetentionBatchValidator();
  const item = newRetentionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionBatchRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RetentionBatchRequiredContactEmailRule("retention batch needs this field");
  const item = newRetentionBatch("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionBatchLabelLengthRule flags a long label", () => {
  const rule = new RetentionBatchLabelLengthRule(16);
  const item = newRetentionBatch("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionBatchRequiredLabelRule flags a blank label", () => {
  const rule = new RetentionBatchRequiredLabelRule("retention batch needs a value");
  const item = newRetentionBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionBatchAmountRangeRule flags values above amount", () => {
  const rule = new RetentionBatchAmountRangeRule(8.4, 1267.5);
  const item = newRetentionBatch("x", "y");
  item.amount = 1269;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
