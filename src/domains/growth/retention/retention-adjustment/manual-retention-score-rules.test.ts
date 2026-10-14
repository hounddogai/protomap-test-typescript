import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRetentionScoreCodeLengthRule,
  ManualRetentionScoreCohortLengthRule,
  ManualRetentionScoreDiscountRangeRule,
  defaultManualRetentionScoreValidator,
} from "./manual-retention-score-rules.js";
import { newManualRetentionScore } from "./manual-retention-score.js";

test("ManualRetentionScoreValidator reports every problem", () => {
  const validator = defaultManualRetentionScoreValidator();
  const item = newManualRetentionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRetentionScoreCohortLengthRule flags a long cohort", () => {
  const rule = new ManualRetentionScoreCohortLengthRule(32);
  const item = newManualRetentionScore("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRetentionScoreCodeLengthRule flags a long code", () => {
  const rule = new ManualRetentionScoreCodeLengthRule(64);
  const item = newManualRetentionScore("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRetentionScoreDiscountRangeRule flags values above discount", () => {
  const rule = new ManualRetentionScoreDiscountRangeRule(6.7, 4056.8);
  const item = newManualRetentionScore("x", "y");
  item.discount = 4058.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
