import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultRetentionBatchAttemptsRangeRule,
  DefaultRetentionBatchClicksRangeRule,
  DefaultRetentionBatchEndsAtRangeRule,
  DefaultRetentionBatchRequiredLabelRule,
  defaultDefaultRetentionBatchValidator,
} from "./default-retention-batch-rules.js";
import { newDefaultRetentionBatch } from "./default-retention-batch.js";

test("DefaultRetentionBatchValidator reports every problem", () => {
  const validator = defaultDefaultRetentionBatchValidator();
  const item = newDefaultRetentionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultRetentionBatchRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultRetentionBatchRequiredLabelRule("default retention batch needs a value");
  const item = newDefaultRetentionBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultRetentionBatchClicksRangeRule flags values above clicks", () => {
  const rule = new DefaultRetentionBatchClicksRangeRule(16, 120);
  const item = newDefaultRetentionBatch("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultRetentionBatchAttemptsRangeRule flags values above attempts", () => {
  const rule = new DefaultRetentionBatchAttemptsRangeRule(3600, 3600);
  const item = newDefaultRetentionBatch("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultRetentionBatchEndsAtRangeRule flags values above ends at", () => {
  const rule = new DefaultRetentionBatchEndsAtRangeRule(16, 3600);
  const item = newDefaultRetentionBatch("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
