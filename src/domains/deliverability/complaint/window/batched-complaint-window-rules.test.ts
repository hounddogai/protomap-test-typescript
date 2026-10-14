import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedComplaintWindowImpressionsRangeRule,
  BatchedComplaintWindowRequiredCodeRule,
  BatchedComplaintWindowRequiredTitleRule,
  BatchedComplaintWindowRequiredUnitRule,
  BatchedComplaintWindowUnitLengthRule,
  defaultBatchedComplaintWindowValidator,
} from "./batched-complaint-window-rules.js";
import { newBatchedComplaintWindow } from "./batched-complaint-window.js";

test("BatchedComplaintWindowValidator reports every problem", () => {
  const validator = defaultBatchedComplaintWindowValidator();
  const item = newBatchedComplaintWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedComplaintWindowRequiredUnitRule flags a blank unit", () => {
  const rule = new BatchedComplaintWindowRequiredUnitRule("batched complaint window needs a value");
  const item = newBatchedComplaintWindow("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedComplaintWindowRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedComplaintWindowRequiredCodeRule("batched complaint window needs an entry");
  const item = newBatchedComplaintWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedComplaintWindowRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedComplaintWindowRequiredTitleRule("batched complaint window needs an entry");
  const item = newBatchedComplaintWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedComplaintWindowImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedComplaintWindowImpressionsRangeRule(16, 86400);
  const item = newBatchedComplaintWindow("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedComplaintWindowUnitLengthRule flags a long unit", () => {
  const rule = new BatchedComplaintWindowUnitLengthRule(1000);
  const item = newBatchedComplaintWindow("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
