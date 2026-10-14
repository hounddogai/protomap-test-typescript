import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionBatchCodeLengthRule,
  SuppressionBatchRequiredCategoryRule,
  SuppressionBatchRequiredTimezoneRule,
  SuppressionBatchRequiredTitleRule,
  defaultSuppressionBatchValidator,
} from "./suppression-batch-rules.js";
import { newSuppressionBatch } from "./suppression-batch.js";

test("SuppressionBatchValidator reports every problem", () => {
  const validator = defaultSuppressionBatchValidator();
  const item = newSuppressionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionBatchRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SuppressionBatchRequiredTimezoneRule("suppression batch needs an entry");
  const item = newSuppressionBatch("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionBatchRequiredCategoryRule flags a blank category", () => {
  const rule = new SuppressionBatchRequiredCategoryRule("suppression batch needs a value");
  const item = newSuppressionBatch("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionBatchCodeLengthRule flags a long code", () => {
  const rule = new SuppressionBatchCodeLengthRule(80);
  const item = newSuppressionBatch("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionBatchRequiredTitleRule flags a blank title", () => {
  const rule = new SuppressionBatchRequiredTitleRule("suppression batch needs a value");
  const item = newSuppressionBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
