import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedBranchPreferenceCostRangeRule,
  BatchedBranchPreferenceSegmentLengthRule,
  defaultBatchedBranchPreferenceValidator,
} from "./batched-branch-preference-rules.js";
import { newBatchedBranchPreference } from "./batched-branch-preference.js";

test("BatchedBranchPreferenceValidator reports every problem", () => {
  const validator = defaultBatchedBranchPreferenceValidator();
  const item = newBatchedBranchPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedBranchPreferenceCostRangeRule flags values above cost", () => {
  const rule = new BatchedBranchPreferenceCostRangeRule(8.6, 4925.6);
  const item = newBatchedBranchPreference("x", "y");
  item.cost = 4927.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedBranchPreferenceSegmentLengthRule flags a long segment", () => {
  const rule = new BatchedBranchPreferenceSegmentLengthRule(16);
  const item = newBatchedBranchPreference("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
