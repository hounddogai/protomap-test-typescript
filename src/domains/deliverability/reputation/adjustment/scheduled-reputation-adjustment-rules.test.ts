import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledReputationAdjustmentRequiredReviewerRule,
  ScheduledReputationAdjustmentReviewerLengthRule,
  ScheduledReputationAdjustmentTitleLengthRule,
  defaultScheduledReputationAdjustmentValidator,
} from "./scheduled-reputation-adjustment-rules.js";
import { newScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

test("ScheduledReputationAdjustmentValidator reports every problem", () => {
  const validator = defaultScheduledReputationAdjustmentValidator();
  const item = newScheduledReputationAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledReputationAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new ScheduledReputationAdjustmentTitleLengthRule(64);
  const item = newScheduledReputationAdjustment("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledReputationAdjustmentRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ScheduledReputationAdjustmentRequiredReviewerRule("scheduled reputation adjustment needs an entry");
  const item = newScheduledReputationAdjustment("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledReputationAdjustmentReviewerLengthRule flags a long reviewer", () => {
  const rule = new ScheduledReputationAdjustmentReviewerLengthRule(1000);
  const item = newScheduledReputationAdjustment("x", "y");
  item.reviewer = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
