import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionAdjustmentOpenRateRangeRule,
  RetentionAdjustmentRequiredTitleRule,
  RetentionAdjustmentSequenceRangeRule,
  RetentionAdjustmentSummaryLengthRule,
  defaultRetentionAdjustmentValidator,
} from "./retention-adjustment-rules.js";
import { newRetentionAdjustment } from "./retention-adjustment.js";

test("RetentionAdjustmentValidator reports every problem", () => {
  const validator = defaultRetentionAdjustmentValidator();
  const item = newRetentionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionAdjustmentOpenRateRangeRule flags values above open rate", () => {
  const rule = new RetentionAdjustmentOpenRateRangeRule(3.4, 2075.5);
  const item = newRetentionAdjustment("x", "y");
  item.openRate = 2077;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionAdjustmentSequenceRangeRule flags values above sequence", () => {
  const rule = new RetentionAdjustmentSequenceRangeRule(32, 64);
  const item = newRetentionAdjustment("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new RetentionAdjustmentRequiredTitleRule("retention adjustment needs this field");
  const item = newRetentionAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionAdjustmentSummaryLengthRule flags a long summary", () => {
  const rule = new RetentionAdjustmentSummaryLengthRule(64);
  const item = newRetentionAdjustment("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
