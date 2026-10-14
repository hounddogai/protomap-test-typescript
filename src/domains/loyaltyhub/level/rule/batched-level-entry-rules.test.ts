import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedLevelEntryBatchSizeRangeRule,
  BatchedLevelEntryCreatedAtRangeRule,
  BatchedLevelEntryDescriptionLengthRule,
  BatchedLevelEntryRequiredNameRule,
  defaultBatchedLevelEntryValidator,
} from "./batched-level-entry-rules.js";
import { newBatchedLevelEntry } from "./batched-level-entry.js";

test("BatchedLevelEntryValidator reports every problem", () => {
  const validator = defaultBatchedLevelEntryValidator();
  const item = newBatchedLevelEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedLevelEntryBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedLevelEntryBatchSizeRangeRule(80, 80);
  const item = newBatchedLevelEntry("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedLevelEntryCreatedAtRangeRule flags values above created at", () => {
  const rule = new BatchedLevelEntryCreatedAtRangeRule(3600, 86400);
  const item = newBatchedLevelEntry("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedLevelEntryDescriptionLengthRule flags a long description", () => {
  const rule = new BatchedLevelEntryDescriptionLengthRule(64);
  const item = newBatchedLevelEntry("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedLevelEntryRequiredNameRule flags a blank name", () => {
  const rule = new BatchedLevelEntryRequiredNameRule("batched level entry needs an entry");
  const item = newBatchedLevelEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
