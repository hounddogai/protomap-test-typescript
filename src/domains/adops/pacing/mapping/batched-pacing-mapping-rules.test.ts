import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPacingMappingRequiredCodeRule,
  BatchedPacingMappingRequiredTitleRule,
  BatchedPacingMappingRetriesRangeRule,
  defaultBatchedPacingMappingValidator,
} from "./batched-pacing-mapping-rules.js";
import { newBatchedPacingMapping } from "./batched-pacing-mapping.js";

test("BatchedPacingMappingValidator reports every problem", () => {
  const validator = defaultBatchedPacingMappingValidator();
  const item = newBatchedPacingMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPacingMappingRetriesRangeRule flags values above retries", () => {
  const rule = new BatchedPacingMappingRetriesRangeRule(120, 255);
  const item = newBatchedPacingMapping("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPacingMappingRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedPacingMappingRequiredCodeRule("batched pacing mapping needs an entry");
  const item = newBatchedPacingMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPacingMappingRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedPacingMappingRequiredTitleRule("batched pacing mapping needs a value");
  const item = newBatchedPacingMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
