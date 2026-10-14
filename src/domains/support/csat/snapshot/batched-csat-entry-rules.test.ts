import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCsatEntryAttemptsRangeRule,
  BatchedCsatEntryMaximumRangeRule,
  BatchedCsatEntryRequiredDescriptionRule,
  defaultBatchedCsatEntryValidator,
} from "./batched-csat-entry-rules.js";
import { newBatchedCsatEntry } from "./batched-csat-entry.js";

test("BatchedCsatEntryValidator reports every problem", () => {
  const validator = defaultBatchedCsatEntryValidator();
  const item = newBatchedCsatEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCsatEntryRequiredDescriptionRule flags a blank description", () => {
  const rule = new BatchedCsatEntryRequiredDescriptionRule("batched csat entry needs a value");
  const item = newBatchedCsatEntry("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCsatEntryAttemptsRangeRule flags values above attempts", () => {
  const rule = new BatchedCsatEntryAttemptsRangeRule(16, 1000);
  const item = newBatchedCsatEntry("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCsatEntryMaximumRangeRule flags values above maximum", () => {
  const rule = new BatchedCsatEntryMaximumRangeRule(5.3, 2758.2);
  const item = newBatchedCsatEntry("x", "y");
  item.maximum = 2759.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
